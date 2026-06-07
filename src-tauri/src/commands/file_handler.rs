use base64::{engine::general_purpose::STANDARD as BASE64, Engine};
use log::{error, info};
use std::path::Path;

const MAX_FILE_SIZE_BYTES: u64 = 20 * 1024 * 1024; // 20 MB

static ALLOWED_IMAGE_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "tiff", "tif", "bmp"];

#[tauri::command]
pub async fn read_pdf_text(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File not found: {file_path}"));
    }

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());

    if extension.as_deref() != Some("pdf") {
        return Err("File must be a PDF".to_string());
    }

    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_FILE_SIZE_BYTES {
        return Err(format!(
            "File too large — max 20 MB, got {:.1} MB",
            metadata.len() as f64 / 1_048_576.0
        ));
    }

    info!("Extracting text from PDF: {file_path}");

    let bytes = std::fs::read(path).map_err(|e| {
        error!("Failed to read PDF bytes: {e}");
        format!("Failed to read file: {e}")
    })?;

    let text = pdf_extract::extract_text_from_mem(&bytes).map_err(|e| {
        error!("PDF extraction failed: {e}");
        format!("Could not extract text — the PDF may be encrypted, scanned-only, or corrupt. Try using the OCR path instead. Detail: {e}")
    })?;

    let trimmed = text.trim().to_string();
    if trimmed.is_empty() {
        return Err(
            "No extractable text found in this PDF. It may be a scanned document — use the image OCR path instead.".to_string(),
        );
    }

    info!("Extracted {} characters from PDF", trimmed.len());
    Ok(trimmed)
}

#[tauri::command]
pub async fn read_image_for_ocr(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);

    if !path.exists() {
        return Err(format!("File not found: {file_path}"));
    }

    let extension = path
        .extension()
        .and_then(|e| e.to_str())
        .map(|e| e.to_lowercase());

    let ext = extension.as_deref().unwrap_or("");
    if !ALLOWED_IMAGE_EXTENSIONS.contains(&ext) {
        return Err(format!(
            "Invalid file type '{ext}' — supported formats: PNG, JPG, TIFF, BMP"
        ));
    }

    let metadata = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() > MAX_FILE_SIZE_BYTES {
        return Err(format!(
            "File too large — max 20 MB, got {:.1} MB",
            metadata.len() as f64 / 1_048_576.0
        ));
    }

    info!("Reading image for OCR: {file_path}");

    let bytes = std::fs::read(path).map_err(|e| {
        error!("Failed to read image bytes: {e}");
        format!("Failed to read file: {e}")
    })?;

    let encoded = BASE64.encode(&bytes);
    info!("Image encoded as base64 ({} bytes original)", bytes.len());
    Ok(encoded)
}

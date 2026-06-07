mod commands;

use commands::{exporter, file_handler, ocr_bridge};

pub fn run() {
    env_logger::init();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            file_handler::read_pdf_text,
            file_handler::read_image_for_ocr,
            ocr_bridge::call_sidecar,
            exporter::export_json,
            exporter::export_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running DocuScan");
}

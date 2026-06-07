use log::{error, info};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::process::{Command, Stdio};
use std::time::Duration;
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone)]
pub struct SidecarPayload {
    pub content: String,
    pub content_type: String,
    pub fields: Vec<String>,
    pub template: String,
    pub provider: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub api_key: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct SidecarResponse {
    pub success: bool,
    pub fields: Vec<ExtractedField>,
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct ExtractedField {
    pub name: String,
    pub value: String,
    pub confidence: f32,
}

#[tauri::command]
pub async fn call_sidecar(
    app: tauri::AppHandle,
    payload: SidecarPayload,
) -> Result<SidecarResponse, String> {
    validate_payload(&payload)?;

    let sidecar_path = resolve_sidecar_path(&app)?;

    let payload_json = serde_json::to_string(&payload).map_err(|e| {
        error!("Failed to serialize sidecar payload: {e}");
        format!("Internal error serializing payload: {e}")
    })?;

    info!(
        "Calling sidecar — template: {}, provider: {}, fields: {:?}",
        payload.template, payload.provider, payload.fields
    );

    let mut child = Command::new(&sidecar_path)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            error!("Failed to spawn sidecar at {sidecar_path:?}: {e}");
            format!("Failed to start extraction engine: {e}")
        })?;

    {
        let stdin = child.stdin.as_mut().ok_or("Failed to open sidecar stdin")?;
        stdin.write_all(payload_json.as_bytes()).map_err(|e| {
            error!("Failed to write to sidecar stdin: {e}");
            format!("Failed to send data to extraction engine: {e}")
        })?;
    }

    let output = wait_with_timeout(child, Duration::from_secs(60)).map_err(|e| {
        error!("Sidecar execution failed: {e}");
        e
    })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!("Sidecar exited with non-zero status. stderr: {stderr}");
        return Err(format!("Extraction engine error: {stderr}"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let response: SidecarResponse = serde_json::from_str(&stdout).map_err(|e| {
        error!("Failed to parse sidecar response: {e}. Raw: {stdout}");
        format!("Extraction engine returned invalid response: {e}")
    })?;

    info!(
        "Sidecar returned {} fields, success={}",
        response.fields.len(),
        response.success
    );

    Ok(response)
}

fn validate_payload(payload: &SidecarPayload) -> Result<(), String> {
    let valid_types = ["text", "image"];
    if !valid_types.contains(&payload.content_type.as_str()) {
        return Err(format!(
            "Invalid content_type '{}' — expected 'text' or 'image'",
            payload.content_type
        ));
    }

    let valid_templates = ["invoice", "resume", "contract", "receipt", "custom"];
    if !valid_templates.contains(&payload.template.as_str()) {
        return Err(format!("Invalid template '{}'", payload.template));
    }

    let valid_providers = ["openai", "gemini", "huggingface"];
    if !valid_providers.contains(&payload.provider.as_str()) {
        return Err(format!("Invalid provider '{}'", payload.provider));
    }

    if payload.provider != "huggingface" && payload.api_key.is_none() {
        return Err(format!(
            "API key required for provider '{}'",
            payload.provider
        ));
    }

    if payload.content.is_empty() {
        return Err("Content is empty — nothing to extract from".to_string());
    }

    Ok(())
}

fn resolve_sidecar_path(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to resolve resource directory: {e}"))?;

    let binary_name = if cfg!(windows) {
        "sidecar.exe"
    } else {
        "sidecar"
    };

    // In development: binaries are in src-tauri/binaries/
    // In production: bundled into the resource directory
    let candidate_paths = [
        resource_dir.join("binaries").join(binary_name),
        resource_dir.join(binary_name),
        // Relative dev path fallback
        std::path::PathBuf::from("src-tauri/binaries").join(binary_name),
    ];

    for path in &candidate_paths {
        if path.exists() {
            info!("Found sidecar at: {path:?}");
            return Ok(path.clone());
        }
    }

    Err(format!(
        "Extraction engine binary not found. Run 'python sidecar/build.py' to build it first. Looked in: {:?}",
        candidate_paths
    ))
}

fn wait_with_timeout(
    child: std::process::Child,
    timeout: Duration,
) -> Result<std::process::Output, String> {
    use std::thread;

    let (tx, rx) = std::sync::mpsc::channel();

    thread::spawn(move || {
        let result = child.wait_with_output();
        let _ = tx.send(result);
    });

    rx.recv_timeout(timeout)
        .map_err(|_| "Extraction timed out after 60 seconds — the document may be too large or the AI provider is unresponsive".to_string())?
        .map_err(|e| format!("Extraction engine process error: {e}"))
}

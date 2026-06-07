use log::{error, info};
use serde_json::Value;
use std::io::Write;

#[tauri::command]
pub async fn export_json(
    app: tauri::AppHandle,
    data: String,
    filename: String,
) -> Result<(), String> {
    let safe_filename = sanitize_filename(&filename, "json");

    let path = show_save_dialog(&app, &safe_filename, &[("JSON Files", &["json"])]).await?;

    // Validate that data is parseable JSON before writing
    let parsed: Value = serde_json::from_str(&data)
        .map_err(|e| format!("Export data is not valid JSON: {e}"))?;

    let pretty = serde_json::to_string_pretty(&parsed)
        .map_err(|e| format!("Failed to format JSON: {e}"))?;

    write_file(&path, pretty.as_bytes()).map_err(|e| {
        error!("Failed to write JSON export to {path}: {e}");
        format!("Failed to write file: {e}")
    })?;

    info!("JSON exported to {path}");
    Ok(())
}

#[tauri::command]
pub async fn export_csv(
    app: tauri::AppHandle,
    data: String,
    filename: String,
) -> Result<(), String> {
    let safe_filename = sanitize_filename(&filename, "csv");

    let path = show_save_dialog(&app, &safe_filename, &[("CSV Files", &["csv"])]).await?;

    let csv_bytes = json_to_csv(&data)?;

    write_file(&path, &csv_bytes).map_err(|e| {
        error!("Failed to write CSV export to {path}: {e}");
        format!("Failed to write file: {e}")
    })?;

    info!("CSV exported to {path}");
    Ok(())
}

fn json_to_csv(json_data: &str) -> Result<Vec<u8>, String> {
    let parsed: Value =
        serde_json::from_str(json_data).map_err(|e| format!("Invalid JSON data: {e}"))?;

    let fields = match &parsed {
        Value::Object(map) => {
            if let Some(Value::Array(fields)) = map.get("fields") {
                fields.clone()
            } else {
                return Err(
                    "Export data must contain a 'fields' array of extracted results".to_string(),
                );
            }
        }
        Value::Array(arr) => arr.clone(),
        _ => return Err("Unexpected JSON structure for CSV export".to_string()),
    };

    let mut writer = csv::Writer::from_writer(vec![]);

    writer
        .write_record(["field", "value", "confidence"])
        .map_err(|e| format!("CSV write error: {e}"))?;

    for field in &fields {
        let name = field
            .get("name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let value = field
            .get("value")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string();
        let confidence = field
            .get("confidence")
            .and_then(|v| v.as_f64())
            .map(|f| format!("{:.2}", f))
            .unwrap_or_else(|| "0.00".to_string());

        writer
            .write_record([&name, &value, &confidence])
            .map_err(|e| format!("CSV write error: {e}"))?;
    }

    writer
        .into_inner()
        .map_err(|e| format!("CSV finalization error: {e}"))
}

fn sanitize_filename(name: &str, extension: &str) -> String {
    let base: String = name
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' || c == '.' {
                c
            } else {
                '_'
            }
        })
        .collect();

    let base = base.trim_matches('_').to_string();
    let base = if base.is_empty() {
        "docuscan_export".to_string()
    } else {
        base
    };

    if base.ends_with(&format!(".{extension}")) {
        base
    } else {
        format!("{base}.{extension}")
    }
}

async fn show_save_dialog(
    app: &tauri::AppHandle,
    default_name: &str,
    filters: &[(&str, &[&str])],
) -> Result<String, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut builder = app.dialog().file().set_file_name(default_name);

    for (name, extensions) in filters {
        builder = builder.add_filter(*name, extensions);
    }

    let path = builder
        .blocking_save_file()
        .ok_or("Save dialog cancelled")?;

    Ok(path.to_string())
}

fn write_file(path: &str, contents: &[u8]) -> std::io::Result<()> {
    let mut file = std::fs::File::create(path)?;
    file.write_all(contents)?;
    file.flush()
}

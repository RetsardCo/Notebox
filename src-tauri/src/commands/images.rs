use crate::commands::notes::AppState;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use std::fs;
use std::path::Path;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn paste_image(
    state: State<'_, AppState>,
    note_id: String,
    base64_data: String,
    extension: Option<String>,
) -> Result<String, String> {
    let clean_b64 = if let Some(idx) = base64_data.find(',') {
        &base64_data[idx + 1..]
    } else {
        &base64_data
    };

    let bytes = BASE64
        .decode(clean_b64)
        .map_err(|e| format!("Failed to decode base64 image: {}", e))?;

    let ext = extension.unwrap_or_else(|| "png".to_string());
    let filename = format!("{}.{}", Uuid::new_v4(), ext);

    let note_asset_dir = state
        .db
        .get_assets_dir()
        .join(&note_id);

    fs::create_dir_all(&note_asset_dir)
        .map_err(|e| format!("Failed to create asset folder: {}", e))?;

    let target_path = note_asset_dir.join(&filename);
    fs::write(&target_path, bytes)
        .map_err(|e| format!("Failed to write image file: {}", e))?;

    let rel_path = format!(".assets/images/{}/{}", note_id, filename);
    Ok(rel_path)
}

#[tauri::command]
pub fn import_image(
    state: State<'_, AppState>,
    note_id: String,
    file_path: String,
) -> Result<String, String> {
    let src_path = Path::new(&file_path);
    if !src_path.exists() {
        return Err("Source image file does not exist".to_string());
    }

    let ext = src_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png");

    let filename = format!("{}.{}", Uuid::new_v4(), ext);
    let note_asset_dir = state.db.get_assets_dir().join(&note_id);
    fs::create_dir_all(&note_asset_dir)
        .map_err(|e| format!("Failed to create asset folder: {}", e))?;

    let target_path = note_asset_dir.join(&filename);
    fs::copy(src_path, &target_path)
        .map_err(|e| format!("Failed to copy image: {}", e))?;

    let rel_path = format!(".assets/images/{}/{}", note_id, filename);
    Ok(rel_path)
}

#[tauri::command]
pub fn get_image_data(state: State<'_, AppState>, relative_path: String) -> Result<String, String> {
    let clean_rel = relative_path.trim_start_matches('/').trim_start_matches('\\');
    let full_path = state.db.get_vault_path().join(clean_rel);

    if !full_path.exists() {
        return Err(format!("Image not found at {:?}", full_path));
    }

    let bytes = fs::read(&full_path).map_err(|e| format!("Failed to read image: {}", e))?;
    let ext = full_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("png")
        .to_lowercase();

    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "image/png",
    };

    let b64 = BASE64.encode(bytes);
    Ok(format!("data:{};base64,{}", mime, b64))
}

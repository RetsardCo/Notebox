use crate::commands::notes::AppState;
use crate::models::SessionState;
use std::fs;
use tauri::State;

#[tauri::command]
pub fn get_session(state: State<'_, AppState>) -> Result<Option<SessionState>, String> {
    let notebox_file = state.db.get_vault_path().join(".notebox").join("session.json");
    let legacy_file = state.db.get_vault_path().join(".noteflow").join("session.json");
    
    let path = if notebox_file.exists() {
        Some(notebox_file)
    } else if legacy_file.exists() {
        Some(legacy_file)
    } else {
        None
    };

    let Some(session_path) = path else {
        return Ok(None);
    };

    let content = fs::read_to_string(&session_path).map_err(|e| e.to_string())?;
    let session: SessionState = serde_json::from_str(&content).map_err(|e| e.to_string())?;
    Ok(Some(session))
}

#[tauri::command]
pub fn save_session(state: State<'_, AppState>, session: SessionState) -> Result<(), String> {
    let notebox_dir = state.db.get_vault_path().join(".notebox");
    let _ = fs::create_dir_all(&notebox_dir);
    let session_file = notebox_dir.join("session.json");
    let tmp_file = notebox_dir.join("session.json.tmp");

    let json = serde_json::to_string_pretty(&session).map_err(|e| e.to_string())?;
    
    // Atomic write
    fs::write(&tmp_file, json).map_err(|e| format!("Failed to write tmp session: {}", e))?;
    fs::rename(&tmp_file, &session_file).map_err(|e| format!("Failed to replace session file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn get_vault_path(state: State<'_, AppState>) -> Result<String, String> {
    Ok(state.db.get_vault_path().to_string_lossy().to_string())
}

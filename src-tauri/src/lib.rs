pub mod commands;
pub mod db;
pub mod models;

use commands::notes::AppState;
use db::{default_vault_path, Database};
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vault_dir = default_vault_path();
    let database = Database::new(vault_dir).expect("Failed to initialize NoteFlow database");
    let state = AppState {
        db: Arc::new(database),
    };

    tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            // Notes
            commands::notes::create_note,
            commands::notes::read_note,
            commands::notes::save_note,
            commands::notes::delete_note,
            commands::notes::restore_note,
            commands::notes::move_note,
            commands::notes::pin_note,
            commands::notes::lock_note,
            commands::notes::unlock_note,
            commands::notes::remove_note_lock,
            commands::notes::duplicate_note,
            commands::notes::get_notes,
            commands::notes::empty_trash,
            commands::notes::export_note,
            // Folders
            commands::folders::get_folders,
            commands::folders::create_folder,
            commands::folders::rename_folder,
            commands::folders::delete_folder,
            commands::folders::get_smart_folders,
            commands::folders::create_smart_folder,
            commands::folders::delete_smart_folder,
            // Tags
            commands::tags::get_tags,
            commands::tags::create_tag,
            commands::tags::delete_tag,
            // Search
            commands::search::search_notes,
            // Images
            commands::images::paste_image,
            commands::images::import_image,
            commands::images::get_image_data,
            // Session & Vault
            commands::session::get_session,
            commands::session::save_session,
            commands::session::get_vault_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

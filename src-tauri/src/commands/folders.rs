use crate::commands::notes::AppState;
use crate::models::{Folder, SmartFolder};
use std::fs;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_folders(state: State<'_, AppState>) -> Result<Vec<Folder>, String> {
    let conn = state.db.lock();

    let mut stmt = conn.prepare(
        "SELECT f.id, f.name, f.parent_id, f.icon, f.sort_order, f.created_at,
                (SELECT COUNT(*) FROM notes n WHERE n.folder_id = f.id AND n.is_trash = 0) as note_count
         FROM folders f
         ORDER BY f.sort_order ASC, f.name COLLATE NOCASE ASC",
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |r| {
        Ok(Folder {
            id: r.get(0)?,
            name: r.get(1)?,
            parent_id: r.get(2)?,
            icon: r.get(3)?,
            sort_order: r.get(4)?,
            created_at: r.get(5)?,
            note_count: r.get::<_, i64>(6)? as usize,
        })
    }).map_err(|e| e.to_string())?;

    let mut folders = Vec::new();
    for r in rows {
        if let Ok(f) = r {
            folders.push(f);
        }
    }

    Ok(folders)
}

#[tauri::command]
pub fn create_folder(
    state: State<'_, AppState>,
    name: String,
    parent_id: Option<String>,
    icon: Option<String>,
) -> Result<Folder, String> {
    let id = Uuid::new_v4().to_string();
    let folder_icon = icon.unwrap_or_else(|| "📁".to_string());
    let conn = state.db.lock();

    conn.execute(
        "INSERT INTO folders (id, name, parent_id, icon, sort_order) VALUES (?1, ?2, ?3, ?4, 0)",
        (&id, &name, &parent_id, &folder_icon),
    ).map_err(|e| e.to_string())?;

    let on_disk_dir = state.db.get_vault_path().join(&name);
    let _ = fs::create_dir_all(on_disk_dir);

    Ok(Folder {
        id,
        name,
        parent_id,
        icon: folder_icon,
        sort_order: 0,
        note_count: 0,
        created_at: chrono::Local::now().to_rfc3339(),
    })
}

#[tauri::command]
pub fn rename_folder(state: State<'_, AppState>, id: String, name: String) -> Result<(), String> {
    let conn = state.db.lock();

    let old_name: String = conn
        .query_row("SELECT name FROM folders WHERE id = ?1", [&id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    if old_name != name {
        let old_dir = state.db.get_vault_path().join(&old_name);
        let new_dir = state.db.get_vault_path().join(&name);
        if old_dir.exists() {
            let _ = fs::rename(&old_dir, &new_dir);
        } else {
            let _ = fs::create_dir_all(&new_dir);
        }

        // Update note file paths in this folder
        let mut stmt = conn
            .prepare("SELECT id, file_path FROM notes WHERE folder_id = ?1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([&id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;

        for r in rows.flatten() {
            let (nid, old_path) = r;
            let filename = std::path::Path::new(&old_path)
                .file_name()
                .and_then(|f| f.to_str())
                .unwrap_or("");
            if !filename.is_empty() {
                let new_path = format!("{}/{}", name, filename);
                let _ = conn.execute("UPDATE notes SET file_path = ?1 WHERE id = ?2", (&new_path, &nid));
            }
        }

        conn.execute(
            "UPDATE folders SET name = ?1 WHERE id = ?2",
            (&name, &id),
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn delete_folder(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock();

    let folder_name: Result<String, _> = conn
        .query_row("SELECT name FROM folders WHERE id = ?1", [&id], |r| r.get(0));

    if let Ok(fname) = folder_name {
        // Move all notes in this folder to the root vault directory
        let mut stmt = conn
            .prepare("SELECT id, file_path FROM notes WHERE folder_id = ?1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([&id], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;

        for r in rows.flatten() {
            let (nid, old_path) = r;
            let filename = std::path::Path::new(&old_path)
                .file_name()
                .and_then(|f| f.to_str())
                .unwrap_or(&format!("{}.md", nid))
                .to_string();

            let old_full = state.db.get_vault_path().join(&old_path);
            let new_full = state.db.get_vault_path().join(&filename);
            if old_full.exists() && old_full != new_full {
                let _ = fs::rename(&old_full, &new_full);
            }
            let _ = conn.execute(
                "UPDATE notes SET folder_id = NULL, file_path = ?1 WHERE id = ?2",
                (&filename, &nid),
            );
        }

        let folder_dir = state.db.get_vault_path().join(&fname);
        let _ = fs::remove_dir_all(folder_dir);
    }

    conn.execute("UPDATE notes SET folder_id = NULL WHERE folder_id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM folders WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_smart_folders(state: State<'_, AppState>) -> Result<Vec<SmartFolder>, String> {
    let conn = state.db.lock();
    let mut stmt = conn.prepare(
        "SELECT id, name, filter_type, filter_json, icon FROM smart_folders",
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |r| {
        Ok(SmartFolder {
            id: r.get(0)?,
            name: r.get(1)?,
            filter_type: r.get(2)?,
            filter_json: r.get(3)?,
            icon: r.get(4)?,
        })
    }).map_err(|e| e.to_string())?;

    let mut list = Vec::new();
    for r in rows {
        if let Ok(sf) = r {
            list.push(sf);
        }
    }
    Ok(list)
}

#[tauri::command]
pub fn create_smart_folder(
    state: State<'_, AppState>,
    name: String,
    filter_type: String,
    filter_json: String,
    icon: Option<String>,
) -> Result<SmartFolder, String> {
    let id = Uuid::new_v4().to_string();
    let icon_str = icon.unwrap_or_else(|| "🔍".to_string());
    let conn = state.db.lock();

    conn.execute(
        "INSERT INTO smart_folders (id, name, filter_type, filter_json, icon) VALUES (?1, ?2, ?3, ?4, ?5)",
        (&id, &name, &filter_type, &filter_json, &icon_str),
    ).map_err(|e| e.to_string())?;

    Ok(SmartFolder {
        id,
        name,
        filter_type,
        filter_json,
        icon: icon_str,
    })
}

#[tauri::command]
pub fn delete_smart_folder(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute("DELETE FROM smart_folders WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

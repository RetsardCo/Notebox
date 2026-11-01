use crate::commands::crypto;
use crate::db::Database;
use crate::models::{NoteDetail, NoteSummary};
use chrono::Local;
use std::collections::HashMap;
use std::fs;
use std::sync::{Arc, Mutex};
use tauri::State;
use uuid::Uuid;

pub struct AppState {
    pub db: Arc<Database>,
    pub unlocked_keys: Arc<Mutex<HashMap<String, String>>>,
}

fn has_checklist_syntax(content: &str) -> bool {
    let lower = content.to_lowercase();
    lower.contains("- [ ]")
        || lower.contains("- [x]")
        || lower.contains("* [ ]")
        || lower.contains("* [x]")
        || lower.contains("+ [ ]")
        || lower.contains("+ [x]")
        || lower.contains("[ ]")
        || lower.contains("[x]")
        || lower.contains("data-type=\"taskitem\"")
        || lower.contains("data-type=\"tasklist\"")
        || lower.contains("task-list-item")
}

fn extract_tags(content: &str) -> Vec<String> {
    let mut tags = Vec::new();
    for word in content.split_whitespace() {
        if word.starts_with('#') && word.len() > 1 {
            let clean: String = word
                .trim_start_matches('#')
                .chars()
                .filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
                .collect();
            if !clean.is_empty() && !tags.contains(&clean) {
                tags.push(clean);
            }
        }
    }
    tags
}

fn extract_preview(content: &str) -> String {
    let lines: Vec<String> = content
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && !l.starts_with('#') && !l.starts_with("!["))
        .map(|l| {
            l.trim_start_matches('>')
                .trim()
                .replace("**", "")
                .replace('*', "")
                .replace('`', "")
        })
        .filter(|l| !l.is_empty())
        .collect();
    
    let text = lines.join(" ");
    let text = text.trim();
    if text.chars().count() > 120 {
        text.chars().take(120).collect::<String>() + "..."
    } else {
        text.to_string()
    }
}

fn sanitize_title(raw_title: &str, content: &str) -> String {
    if !raw_title.trim().is_empty() && raw_title.trim() != "Untitled" {
        return raw_title.trim().to_string();
    }
    for line in content.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() {
            let title = trimmed.trim_start_matches('#').trim();
            if !title.is_empty() {
                return title.chars().take(60).collect();
            }
        }
    }
    "Untitled Note".to_string()
}

#[tauri::command]
pub fn create_note(
    state: State<'_, AppState>,
    folder_id: Option<String>,
    title: Option<String>,
    content: Option<String>,
) -> Result<NoteSummary, String> {
    let id = Uuid::new_v4().to_string();
    let initial_content = content.unwrap_or_default();
    let note_title = sanitize_title(&title.unwrap_or_default(), &initial_content);
    let preview = extract_preview(&initial_content);
    let word_count = initial_content.split_whitespace().count();
    let char_count = initial_content.chars().count();
    let has_checklist = has_checklist_syntax(&initial_content);
    let now = Local::now().to_rfc3339();

    let conn = state.db.lock();

    let folder_name: Option<String> = if let Some(ref fid) = folder_id {
        conn.query_row("SELECT name FROM folders WHERE id = ?1", [fid], |r| r.get(0)).ok()
    } else {
        None
    };

    let rel_file_path = if let Some(ref fname) = folder_name {
        let folder_dir = state.db.get_vault_path().join(fname);
        let _ = fs::create_dir_all(&folder_dir);
        format!("{}/{}.md", fname, id)
    } else {
        format!("{}.md", id)
    };

    let full_path = state.db.get_vault_path().join(&rel_file_path);

    fs::write(&full_path, &initial_content)
        .map_err(|e| format!("Failed to write note file: {}", e))?;

    conn.execute(
        "INSERT INTO notes (id, title, folder_id, file_path, created_at, updated_at, pinned, locked, is_trash, has_checklist, word_count, char_count, preview)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, 0, ?7, ?8, ?9, ?10)",
        (
            &id,
            &note_title,
            &folder_id,
            &rel_file_path,
            &now,
            &now,
            if has_checklist { 1 } else { 0 },
            word_count as i64,
            char_count as i64,
            &preview,
        ),
    ).map_err(|e| e.to_string())?;

    // Update FTS
    let tags = extract_tags(&initial_content);
    let tag_str = tags.iter().map(|t| format!("#{}", t)).collect::<Vec<_>>().join(" ");
    let _ = conn.execute(
        "INSERT INTO notes_fts (note_id, title, content, tags) VALUES (?1, ?2, ?3, ?4)",
        (&id, &note_title, &initial_content, &tag_str),
    );

    // Sync tags
    for tag_name in &tags {
        let tag_id = Uuid::new_v4().to_string();
        let _ = conn.execute("INSERT OR IGNORE INTO tags (id, name) VALUES (?1, ?2)", (&tag_id, tag_name));
        let actual_tag_id: String = conn.query_row("SELECT id FROM tags WHERE name = ?1", [tag_name], |r| r.get(0)).unwrap_or_default();
        if !actual_tag_id.is_empty() {
            let _ = conn.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)", (&id, &actual_tag_id));
        }
    }

    Ok(NoteSummary {
        id,
        title: note_title,
        folder_id,
        folder_name,
        file_path: rel_file_path,
        created_at: now.clone(),
        updated_at: now,
        pinned: false,
        locked: false,
        is_trash: false,
        has_checklist,
        preview,
        word_count,
        char_count,
        tags,
    })
}

#[tauri::command]
pub fn read_note(state: State<'_, AppState>, id: String) -> Result<NoteDetail, String> {
    let conn = state.db.lock();

    let mut stmt = conn.prepare(
        "SELECT n.id, n.title, n.folder_id, f.name, n.file_path, n.created_at, n.updated_at,
                n.pinned, n.locked, n.is_trash, n.word_count, n.char_count, n.has_checklist
         FROM notes n
         LEFT JOIN folders f ON n.folder_id = f.id
         WHERE n.id = ?1",
    ).map_err(|e| e.to_string())?;

    let row = stmt.query_row([&id], |r| {
        Ok((
            r.get::<_, String>(0)?,
            r.get::<_, String>(1)?,
            r.get::<_, Option<String>>(2)?,
            r.get::<_, Option<String>>(3)?,
            r.get::<_, String>(4)?,
            r.get::<_, String>(5)?,
            r.get::<_, String>(6)?,
            r.get::<_, bool>(7)?,
            r.get::<_, bool>(8)?,
            r.get::<_, bool>(9)?,
            r.get::<_, i64>(10)?,
            r.get::<_, i64>(11)?,
            r.get::<_, bool>(12)?,
        ))
    }).map_err(|e| format!("Note not found: {}", e))?;

    let (nid, title, folder_id, folder_name, rel_file_path, created_at, updated_at, pinned, locked, is_trash, word_count, char_count, has_checklist) = row;

    let full_path = state.db.get_vault_path().join(&rel_file_path);
    let content = if locked {
        let keys = state.unlocked_keys.lock().unwrap();
        if let Some(password) = keys.get(&id) {
            let encrypted = fs::read_to_string(&full_path).unwrap_or_default();
            crypto::decrypt_content(&encrypted, password)
                .unwrap_or_else(|_| "[LOCKED NOTE] Please enter password to view content.".to_string())
        } else {
            "[LOCKED NOTE] Please enter password to view content.".to_string()
        }
    } else {
        fs::read_to_string(&full_path).unwrap_or_default()
    };

    // Get tags
    let mut tag_stmt = conn.prepare(
        "SELECT t.name FROM tags t
         JOIN note_tags nt ON t.id = nt.tag_id
         WHERE nt.note_id = ?1",
    ).map_err(|e| e.to_string())?;
    
    let tag_rows = tag_stmt.query_map([&id], |r| r.get::<_, String>(0)).map_err(|e| e.to_string())?;
    let mut tags = Vec::new();
    for t in tag_rows {
        if let Ok(tag) = t {
            tags.push(tag);
        }
    }

    Ok(NoteDetail {
        id: nid,
        title,
        folder_id,
        folder_name,
        file_path: rel_file_path,
        content,
        created_at,
        updated_at,
        pinned,
        locked,
        is_trash,
        has_checklist,
        word_count: word_count as usize,
        char_count: char_count as usize,
        tags,
    })
}

#[tauri::command]
pub fn save_note(
    state: State<'_, AppState>,
    id: String,
    content: String,
    title: Option<String>,
) -> Result<NoteSummary, String> {
    let note_title = sanitize_title(&title.unwrap_or_default(), &content);
    let preview = extract_preview(&content);
    let word_count = content.split_whitespace().count();
    let char_count = content.chars().count();
    let has_checklist = has_checklist_syntax(&content);
    let now = Local::now().to_rfc3339();

    let conn = state.db.lock();

    let (rel_file_path, folder_id, locked, _password_hash): (String, Option<String>, bool, Option<String>) = conn
        .query_row(
            "SELECT file_path, folder_id, locked, password_hash FROM notes WHERE id = ?1",
            [&id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
        )
        .map_err(|e| format!("Note not found: {}", e))?;

    let full_path = state.db.get_vault_path().join(&rel_file_path);

    // If locked, verify that the session has unlocked it
    if locked {
        let keys = state.unlocked_keys.lock().unwrap();
        if let Some(password) = keys.get(&id) {
            let ciphertext = crypto::encrypt_content(&content, password)?;
            fs::write(&full_path, ciphertext)
                .map_err(|e| format!("Failed to write note file: {}", e))?;
        } else {
            return Err("Cannot save locked note without unlocking".to_string());
        }
    } else {
        fs::write(&full_path, &content)
            .map_err(|e| format!("Failed to write note file: {}", e))?;
    }

    conn.execute(
        "UPDATE notes SET title = ?1, updated_at = ?2, word_count = ?3, char_count = ?4, preview = ?5, has_checklist = ?6 WHERE id = ?7",
        (
            &note_title,
            &now,
            word_count as i64,
            char_count as i64,
            &preview,
            if has_checklist { 1 } else { 0 },
            &id,
        ),
    ).map_err(|e| e.to_string())?;

    // Update FTS
    let tags = extract_tags(&content);
    let tag_str = tags.iter().map(|t| format!("#{}", t)).collect::<Vec<_>>().join(" ");
    let _ = conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [&id]);
    let _ = conn.execute(
        "INSERT INTO notes_fts (note_id, title, content, tags) VALUES (?1, ?2, ?3, ?4)",
        (&id, &note_title, &content, &tag_str),
    );

    // Sync tags
    let _ = conn.execute("DELETE FROM note_tags WHERE note_id = ?1", [&id]);
    for tag_name in &tags {
        let tag_id = Uuid::new_v4().to_string();
        let _ = conn.execute("INSERT OR IGNORE INTO tags (id, name) VALUES (?1, ?2)", (&tag_id, tag_name));
        let actual_tag_id: String = conn.query_row("SELECT id FROM tags WHERE name = ?1", [tag_name], |r| r.get(0)).unwrap_or_default();
        if !actual_tag_id.is_empty() {
            let _ = conn.execute("INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?1, ?2)", (&id, &actual_tag_id));
        }
    }

    let folder_name: Option<String> = if let Some(ref fid) = folder_id {
        conn.query_row("SELECT name FROM folders WHERE id = ?1", [fid], |r| r.get(0)).ok()
    } else {
        None
    };

    let (created_at, pinned, is_trash): (String, bool, bool) = conn
        .query_row("SELECT created_at, pinned, is_trash FROM notes WHERE id = ?1", [&id], |r| {
            Ok((r.get(0)?, r.get(1)?, r.get(2)?))
        })
        .unwrap_or((now.clone(), false, false));

    Ok(NoteSummary {
        id,
        title: note_title,
        folder_id,
        folder_name,
        file_path: rel_file_path,
        created_at,
        updated_at: now,
        pinned,
        locked,
        is_trash,
        has_checklist,
        preview,
        word_count,
        char_count,
        tags,
    })
}

#[tauri::command]
pub fn delete_note(state: State<'_, AppState>, id: String, permanent: bool) -> Result<(), String> {
    let conn = state.db.lock();

    if permanent {
        let rel_file_path: Result<String, _> = conn.query_row(
            "SELECT file_path FROM notes WHERE id = ?1",
            [&id],
            |r| r.get(0),
        );
        if let Ok(path) = rel_file_path {
            let full_path = state.db.get_vault_path().join(path);
            let _ = fs::remove_file(full_path);
        }
        let _ = conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [&id]);
        conn.execute("DELETE FROM notes WHERE id = ?1", [&id]).map_err(|e| e.to_string())?;
    } else {
        conn.execute("UPDATE notes SET is_trash = 1, updated_at = ?2 WHERE id = ?1", (&id, Local::now().to_rfc3339()))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn restore_note(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute("UPDATE notes SET is_trash = 0, updated_at = ?2 WHERE id = ?1", (&id, Local::now().to_rfc3339()))
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn move_note(state: State<'_, AppState>, id: String, folder_id: Option<String>) -> Result<(), String> {
    let conn = state.db.lock();

    let old_rel_path: String = conn
        .query_row("SELECT file_path FROM notes WHERE id = ?1", [&id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let filename = std::path::Path::new(&old_rel_path)
        .file_name()
        .and_then(|f| f.to_str())
        .unwrap_or(&format!("{}.md", id))
        .to_string();

    let new_rel_path = if let Some(ref fid) = folder_id {
        let folder_name: String = conn
            .query_row("SELECT name FROM folders WHERE id = ?1", [fid], |r| r.get(0))
            .map_err(|e| format!("Folder not found: {}", e))?;
        let target_dir = state.db.get_vault_path().join(&folder_name);
        let _ = fs::create_dir_all(&target_dir);
        format!("{}/{}", folder_name, filename)
    } else {
        filename
    };

    let old_full = state.db.get_vault_path().join(&old_rel_path);
    let new_full = state.db.get_vault_path().join(&new_rel_path);

    if old_full.exists() && old_full != new_full {
        let _ = fs::rename(&old_full, &new_full);
    }

    conn.execute(
        "UPDATE notes SET folder_id = ?1, file_path = ?2, updated_at = ?3 WHERE id = ?4",
        (&folder_id, &new_rel_path, Local::now().to_rfc3339(), &id),
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn pin_note(state: State<'_, AppState>, id: String, pinned: bool) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute(
        "UPDATE notes SET pinned = ?1, updated_at = ?2 WHERE id = ?3",
        (pinned, Local::now().to_rfc3339(), &id),
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn lock_note(state: State<'_, AppState>, id: String, password: String) -> Result<(), String> {
    let hash = crypto::hash_password(&password);
    let conn = state.db.lock();

    let rel_file_path: String = conn
        .query_row("SELECT file_path FROM notes WHERE id = ?1", [&id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let full_path = state.db.get_vault_path().join(&rel_file_path);
    let raw_content = fs::read_to_string(&full_path).unwrap_or_default();
    let encrypted = crypto::encrypt_content(&raw_content, &password)?;

    fs::write(&full_path, encrypted).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE notes SET locked = 1, password_hash = ?1, updated_at = ?2 WHERE id = ?3",
        (&hash, Local::now().to_rfc3339(), &id),
    ).map_err(|e| e.to_string())?;

    // Store key in memory for current session
    state.unlocked_keys.lock().unwrap().insert(id, password);

    Ok(())
}

#[tauri::command]
pub fn unlock_note(state: State<'_, AppState>, id: String, password: String) -> Result<NoteDetail, String> {
    let conn = state.db.lock();

    let (rel_file_path, stored_hash): (String, Option<String>) = conn
        .query_row("SELECT file_path, password_hash FROM notes WHERE id = ?1", [&id], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .map_err(|e| e.to_string())?;

    if let Some(hash) = stored_hash {
        if !crypto::verify_password(&password, &hash) {
            return Err("Incorrect password".to_string());
        }
    } else {
        return Err("Note is not locked".to_string());
    }

    let full_path = state.db.get_vault_path().join(&rel_file_path);
    let encrypted_content = fs::read_to_string(&full_path).map_err(|e| e.to_string())?;
    let decrypted = crypto::decrypt_content(&encrypted_content, &password)?;

    // Store key in memory for current session
    state.unlocked_keys.lock().unwrap().insert(id.clone(), password);

    // Return note detail with decrypted content
    drop(conn);
    let mut detail = read_note(state, id)?;
    detail.content = decrypted;
    Ok(detail)
}

#[tauri::command]
pub fn remove_note_lock(state: State<'_, AppState>, id: String, password: String) -> Result<(), String> {
    let conn = state.db.lock();

    let (rel_file_path, stored_hash): (String, Option<String>) = conn
        .query_row("SELECT file_path, password_hash FROM notes WHERE id = ?1", [&id], |r| {
            Ok((r.get(0)?, r.get(1)?))
        })
        .map_err(|e| e.to_string())?;

    if let Some(hash) = stored_hash {
        if !crypto::verify_password(&password, &hash) {
            return Err("Incorrect password".to_string());
        }
    }

    let full_path = state.db.get_vault_path().join(&rel_file_path);
    let encrypted_content = fs::read_to_string(&full_path).map_err(|e| e.to_string())?;
    let decrypted = crypto::decrypt_content(&encrypted_content, &password)?;
    fs::write(&full_path, decrypted).map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE notes SET locked = 0, password_hash = NULL, updated_at = ?1 WHERE id = ?2",
        (Local::now().to_rfc3339(), &id),
    ).map_err(|e| e.to_string())?;

    state.unlocked_keys.lock().unwrap().remove(&id);

    Ok(())
}

#[tauri::command]
pub fn duplicate_note(state: State<'_, AppState>, id: String) -> Result<NoteSummary, String> {
    let detail = read_note(state.clone(), id)?;
    let new_title = format!("{} (Copy)", detail.title);
    create_note(state, detail.folder_id, Some(new_title), Some(detail.content))
}

#[tauri::command]
pub fn get_notes(
    state: State<'_, AppState>,
    folder_id: Option<String>,
    tag: Option<String>,
    filter_type: Option<String>,
    sort_by: Option<String>,
) -> Result<Vec<NoteSummary>, String> {
    let conn = state.db.lock();

    let is_trash = filter_type.as_deref() == Some("trash");
    let is_pinned_only = filter_type.as_deref() == Some("pinned");
    let is_checklist_only = filter_type.as_deref() == Some("checklist");

    let mut query = String::from(
        "SELECT n.id, n.title, n.folder_id, f.name, n.file_path, n.created_at, n.updated_at,
                n.pinned, n.locked, n.is_trash, n.word_count, n.char_count, n.preview, n.has_checklist
         FROM notes n
         LEFT JOIN folders f ON n.folder_id = f.id ",
    );

    let mut conditions = Vec::new();
    let mut params: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if is_trash {
        conditions.push("n.is_trash = 1".to_string());
    } else {
        conditions.push("n.is_trash = 0".to_string());

        if is_pinned_only {
            conditions.push("n.pinned = 1".to_string());
        }

        if is_checklist_only {
            conditions.push("n.has_checklist = 1".to_string());
        }

        if let Some(fid) = folder_id {
            conditions.push("n.folder_id = ?".to_string());
            params.push(Box::new(fid));
        }

        if let Some(t) = tag {
            query.push_str("JOIN note_tags nt ON n.id = nt.note_id JOIN tags tg ON nt.tag_id = tg.id ");
            conditions.push("tg.name = ?".to_string());
            params.push(Box::new(t));
        }
    }

    if !conditions.is_empty() {
        query.push_str("WHERE ");
        query.push_str(&conditions.join(" AND "));
    }

    // Sort: pinned always top, then order by user criteria
    let order = match sort_by.as_deref() {
        Some("title") => "ORDER BY n.pinned DESC, n.title COLLATE NOCASE ASC",
        Some("created") => "ORDER BY n.pinned DESC, n.created_at DESC",
        _ => "ORDER BY n.pinned DESC, n.updated_at DESC",
    };
    query.push_str(&format!(" {}", order));

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let rows = stmt.query_map(&param_refs[..], |r| {
        Ok(NoteSummary {
            id: r.get(0)?,
            title: r.get(1)?,
            folder_id: r.get(2)?,
            folder_name: r.get(3)?,
            file_path: r.get(4)?,
            created_at: r.get(5)?,
            updated_at: r.get(6)?,
            pinned: r.get(7)?,
            locked: r.get(8)?,
            is_trash: r.get(9)?,
            word_count: r.get::<_, i64>(10)? as usize,
            char_count: r.get::<_, i64>(11)? as usize,
            preview: r.get(12)?,
            has_checklist: r.get::<_, bool>(13).unwrap_or(false),
            tags: Vec::new(),
        })
    }).map_err(|e| e.to_string())?;

    let mut notes = Vec::new();
    for r in rows {
        if let Ok(mut note) = r {
            // Fetch tags for note
            let mut tag_stmt = conn.prepare(
                "SELECT t.name FROM tags t JOIN note_tags nt ON t.id = nt.tag_id WHERE nt.note_id = ?1",
            ).map_err(|e| e.to_string())?;
            let tag_rows = tag_stmt.query_map([&note.id], |tr| tr.get::<_, String>(0)).unwrap();
            for tr in tag_rows {
                if let Ok(tname) = tr {
                    note.tags.push(tname);
                }
            }
            notes.push(note);
        }
    }

    Ok(notes)
}

#[tauri::command]
pub fn empty_trash(state: State<'_, AppState>) -> Result<u32, String> {
    let conn = state.db.lock();
    let mut stmt = conn.prepare("SELECT id, file_path FROM notes WHERE is_trash = 1").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))).map_err(|e| e.to_string())?;

    let mut count = 0;
    for r in rows {
        if let Ok((id, file_path)) = r {
            let full_path = state.db.get_vault_path().join(file_path);
            let _ = fs::remove_file(full_path);
            let _ = conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [&id]);
            let _ = conn.execute("DELETE FROM notes WHERE id = ?1", [&id]);
            count += 1;
        }
    }

    Ok(count)
}

#[tauri::command]
pub fn export_note(state: State<'_, AppState>, id: String, format: String) -> Result<String, String> {
    let note = read_note(state, id)?;
    match format.to_lowercase().as_str() {
        "txt" => {
            // Strip markdown symbols
            let clean = note.content
                .lines()
                .map(|l| l.trim_start_matches('#').trim())
                .collect::<Vec<_>>()
                .join("\n");
            Ok(clean)
        }
        "html" => {
            let body = format!("<!DOCTYPE html><html><head><title>{}</title><meta charset='utf-8'></head><body><pre>{}</pre></body></html>", note.title, note.content);
            Ok(body)
        }
        _ => Ok(note.content), // Default markdown
    }
}

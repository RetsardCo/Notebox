use crate::commands::notes::AppState;
use crate::models::Tag;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub fn get_tags(state: State<'_, AppState>) -> Result<Vec<Tag>, String> {
    let conn = state.db.lock();

    let mut stmt = conn.prepare(
        "SELECT t.id, t.name, t.color,
                (SELECT COUNT(*) FROM note_tags nt 
                 JOIN notes n ON nt.note_id = n.id 
                 WHERE nt.tag_id = t.id AND n.is_trash = 0) as note_count
         FROM tags t
         ORDER BY t.name COLLATE NOCASE ASC",
    ).map_err(|e| e.to_string())?;

    let rows = stmt.query_map([], |r| {
        Ok(Tag {
            id: r.get(0)?,
            name: r.get(1)?,
            color: r.get(2)?,
            note_count: r.get::<_, i64>(3)? as usize,
        })
    }).map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for r in rows {
        if let Ok(t) = r {
            tags.push(t);
        }
    }

    Ok(tags)
}

#[tauri::command]
pub fn create_tag(state: State<'_, AppState>, name: String, color: Option<String>) -> Result<Tag, String> {
    let clean_name = name.trim().trim_start_matches('#').to_string();
    if clean_name.is_empty() {
        return Err("Tag name cannot be empty".to_string());
    }

    let id = Uuid::new_v4().to_string();
    let tag_color = color.unwrap_or_else(|| "#e5a823".to_string());
    let conn = state.db.lock();

    conn.execute(
        "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
        (&id, &clean_name, &tag_color),
    ).map_err(|e| e.to_string())?;

    Ok(Tag {
        id,
        name: clean_name,
        color: tag_color,
        note_count: 0,
    })
}

#[tauri::command]
pub fn delete_tag(state: State<'_, AppState>, id: String) -> Result<(), String> {
    let conn = state.db.lock();
    conn.execute("DELETE FROM tags WHERE id = ?1", [&id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

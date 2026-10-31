use crate::commands::notes::AppState;
use crate::models::SearchResult;
use tauri::State;

#[tauri::command]
pub fn search_notes(
    state: State<'_, AppState>,
    query: String,
    folder_id: Option<String>,
) -> Result<Vec<SearchResult>, String> {
    let clean_query = query.trim();
    if clean_query.is_empty() {
        return Ok(Vec::new());
    }

    let conn = state.db.lock();

    // First try FTS5 query
    let fts_query = format!("\"{}\"*", clean_query.replace('"', "\"\""));
    let mut results = Vec::new();

    let sql_fts = "
        SELECT fts.note_id, n.title, f.name, n.updated_at,
               snippet(notes_fts, 2, '<b>', '</b>', '...', 16) as snip
        FROM notes_fts fts
        JOIN notes n ON fts.note_id = n.id
        LEFT JOIN folders f ON n.folder_id = f.id
        WHERE notes_fts MATCH ?1 AND n.is_trash = 0 AND n.locked = 0
        LIMIT 30;
    ";

    let fts_res = conn.prepare(sql_fts).and_then(|mut stmt| {
        let rows = stmt.query_map([&fts_query], |r| {
            Ok(SearchResult {
                note_id: r.get(0)?,
                title: r.get(1)?,
                folder_name: r.get(2)?,
                updated_at: r.get(3)?,
                snippet: r.get(4)?,
                match_type: "full-text".to_string(),
            })
        })?;
        let mut list = Vec::new();
        for r in rows {
            if let Ok(item) = r {
                list.push(item);
            }
        }
        Ok(list)
    });

    if let Ok(fts_list) = fts_res {
        results = fts_list;
    }

    // If FTS returned few results or query has special chars, supplement with LIKE
    if results.len() < 10 {
        let like_param = format!("%{}%", clean_query);
        let sql_like = "
            SELECT n.id, n.title, f.name, n.updated_at, n.preview
            FROM notes n
            LEFT JOIN folders f ON n.folder_id = f.id
            WHERE (n.title LIKE ?1 OR n.preview LIKE ?1)
              AND n.is_trash = 0 AND n.locked = 0
            LIMIT 30;
        ";
        if let Ok(mut stmt) = conn.prepare(sql_like) {
            if let Ok(rows) = stmt.query_map([&like_param], |r| {
                Ok(SearchResult {
                    note_id: r.get(0)?,
                    title: r.get(1)?,
                    folder_name: r.get(2)?,
                    updated_at: r.get(3)?,
                    snippet: r.get(4)?,
                    match_type: "title/preview".to_string(),
                })
            }) {
                for r in rows {
                    if let Ok(item) = r {
                        if !results.iter().any(|existing| existing.note_id == item.note_id) {
                            results.push(item);
                        }
                    }
                }
            }
        }
    }

    // Filter by folder if specified
    if let Some(ref fid) = folder_id {
        let filtered: Vec<SearchResult> = results
            .into_iter()
            .filter(|r| {
                let note_fid: Option<String> = conn
                    .query_row("SELECT folder_id FROM notes WHERE id = ?1", [&r.note_id], |row| row.get(0))
                    .unwrap_or(None);
                note_fid.as_ref() == Some(fid)
            })
            .collect();
        return Ok(filtered);
    }

    Ok(results)
}

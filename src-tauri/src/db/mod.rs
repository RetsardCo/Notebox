pub mod schema;

use rusqlite::Connection;
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use uuid::Uuid;

pub struct Database {
    conn: Mutex<Connection>,
    vault_path: PathBuf,
}

impl Database {
    pub fn new(vault_path: PathBuf) -> Result<Self, String> {
        let notebox_dir = vault_path.join(".notebox");
        let legacy_noteflow_dir = vault_path.join(".noteflow");
        let assets_dir = vault_path.join(".assets").join("images");
        
        fs::create_dir_all(&vault_path).map_err(|e| format!("Failed to create vault dir: {}", e))?;
        fs::create_dir_all(&notebox_dir).map_err(|e| format!("Failed to create .notebox dir: {}", e))?;
        fs::create_dir_all(&assets_dir).map_err(|e| format!("Failed to create assets dir: {}", e))?;

        let db_path = notebox_dir.join("notebox.db");
        let legacy_db_path = legacy_noteflow_dir.join("noteflow.db");
        let fallback_db_in_new_dir = notebox_dir.join("noteflow.db");

        // Migrate from legacy noteflow.db if notebox.db does not exist yet
        if !db_path.exists() {
            if legacy_db_path.exists() {
                let _ = fs::copy(&legacy_db_path, &db_path);
            } else if fallback_db_in_new_dir.exists() {
                let _ = fs::copy(&fallback_db_in_new_dir, &db_path);
            }
        }

        // Migrate session.json if it exists in .noteflow but not in .notebox
        let session_file = notebox_dir.join("session.json");
        let legacy_session_file = legacy_noteflow_dir.join("session.json");
        if !session_file.exists() && legacy_session_file.exists() {
            let _ = fs::copy(&legacy_session_file, &session_file);
        }

        let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open SQLite database: {}", e))?;

        // Enable foreign keys and WAL mode for optimal performance and concurrency
        conn.execute_batch(
            "PRAGMA foreign_keys = ON;
             PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;",
        ).map_err(|e| format!("Failed to configure pragmas: {}", e))?;

        // Run migrations/schema
        conn.execute(schema::CREATE_FOLDERS_TABLE, [])
            .map_err(|e| format!("Failed to create folders table: {}", e))?;
        conn.execute(schema::CREATE_NOTES_TABLE, [])
            .map_err(|e| format!("Failed to create notes table: {}", e))?;
        conn.execute(schema::CREATE_TAGS_TABLE, [])
            .map_err(|e| format!("Failed to create tags table: {}", e))?;
        conn.execute(schema::CREATE_NOTE_TAGS_TABLE, [])
            .map_err(|e| format!("Failed to create note_tags table: {}", e))?;
        conn.execute(schema::CREATE_SMART_FOLDERS_TABLE, [])
            .map_err(|e| format!("Failed to create smart_folders table: {}", e))?;
        
        // FTS5 table
        let _ = conn.execute(schema::CREATE_FTS_TABLE, []);

        // Migrations for existing databases
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN has_checklist BOOLEAN DEFAULT 0", []);

        let db = Self {
            conn: Mutex::new(conn),
            vault_path,
        };

        db.purge_old_trash();
        db.seed_defaults()?;
        Ok(db)
    }

    pub fn purge_old_trash(&self) -> u32 {
        let conn = self.lock();
        let mut stmt = match conn.prepare("SELECT id, file_path FROM notes WHERE is_trash = 1 AND updated_at < datetime('now', '-30 days')") {
            Ok(s) => s,
            Err(_) => return 0,
        };
        let rows = match stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))) {
            Ok(r) => r,
            Err(_) => return 0,
        };

        let mut count = 0;
        for r in rows.flatten() {
            let (id, file_path) = r;
            let full_path = self.vault_path.join(file_path);
            let _ = fs::remove_file(full_path);
            let _ = conn.execute("DELETE FROM notes_fts WHERE note_id = ?1", [&id]);
            let _ = conn.execute("DELETE FROM notes WHERE id = ?1", [&id]);
            count += 1;
        }
        count
    }

    pub fn get_vault_path(&self) -> PathBuf {
        self.vault_path.clone()
    }

    pub fn get_assets_dir(&self) -> PathBuf {
        self.vault_path.join(".assets").join("images")
    }

    pub fn lock(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().expect("Database mutex poisoned")
    }

    pub fn seed_defaults(&self) -> Result<(), String> {
        let conn = self.lock();

        // Check if any folders exist
        let folder_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM folders", [], |r| r.get(0))
            .unwrap_or(0);

        if folder_count == 0 {
            let personal_id = Uuid::new_v4().to_string();
            let work_id = Uuid::new_v4().to_string();
            let ideas_id = Uuid::new_v4().to_string();

            // Insert folders
            conn.execute(
                "INSERT INTO folders (id, name, icon, sort_order) VALUES (?1, ?2, ?3, ?4)",
                (&personal_id, "Personal", "📁", 1),
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO folders (id, name, icon, sort_order) VALUES (?1, ?2, ?3, ?4)",
                (&work_id, "Work", "💼", 2),
            ).map_err(|e| e.to_string())?;

            conn.execute(
                "INSERT INTO folders (id, name, icon, sort_order) VALUES (?1, ?2, ?3, ?4)",
                (&ideas_id, "Ideas", "💡", 3),
            ).map_err(|e| e.to_string())?;

            // Create on-disk directory matching folders
            let _ = fs::create_dir_all(self.vault_path.join("Personal"));
            let _ = fs::create_dir_all(self.vault_path.join("Work"));
            let _ = fs::create_dir_all(self.vault_path.join("Ideas"));

            // Insert default tags
            let tags = [
                ("todo", "#f59e0b"),
                ("important", "#ef4444"),
                ("meeting", "#3b82f6"),
                ("draft", "#8b5cf6"),
            ];
            for (name, color) in tags {
                let tag_id = Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
                    (&tag_id, name, color),
                );
            }

            // Insert default smart folders
            let smart_folders = [
                ("All Notes", "all", "{}", "📝"),
                ("Checklists", "checklist", r#"{"type":"has_checklist"}"#, "✅"),
                ("Pinned", "pinned", r#"{"type":"pinned"}"#, "📌"),
                ("Trash", "trash", r#"{"type":"trash"}"#, "🗑️"),
            ];
            for (name, ftype, fjson, icon) in smart_folders {
                let sf_id = Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO smart_folders (id, name, filter_type, filter_json, icon) VALUES (?1, ?2, ?3, ?4, ?5)",
                    (&sf_id, name, ftype, fjson, icon),
                );
            }

            // Create Welcome Note
            let welcome_id = Uuid::new_v4().to_string();
            let welcome_rel_path = "Personal/Welcome to Notebox.md";
            let welcome_file_path = self.vault_path.join(welcome_rel_path);

            let welcome_content = r#"# Welcome to Notebox

> **Your notes, ideas, and knowledge in one place.**

Notebox helps you capture thoughts quickly, keep them organized, and turn ideas into action.

---

### ✨ What Makes Notebox Special?

1. **Instant Session Restore (Notepad-style)**
   - Close Notebox at any moment — even without saving!
   - Every tab, unsaved scratch note, cursor position, and scroll location is restored instantly.
   - Zero "Do you want to save before exiting?" annoying dialogs. Auto-saves continuously in the background!

2. **Personalization & Color Palettes**
   - 6 beautiful theme palettes: **Warm Paper**, **Midnight**, **Forest**, **Ocean**, **Lavender**, and **Sunset**.
   - Custom-tailored typography and comfortable margins designed for distraction-free writing.

3. **Apple Notes 3-Column Experience**
   - Three sleek columns: **Folders & Tags** ➔ **Note List Cards** ➔ **Distraction-Free Editor**.
   - Organized, flexible, and lightning-fast.

4. **Obsidian-Style Freedom**
   - All notes are plain **Markdown (.md)** files inside your vault folder.
   - You can open, edit, sync, or git-commit your notes anytime using any tool.
   - Link notes together using `[[Note Title]]` wiki-links!

---

### 🚀 Interactive Checklist Example
- [x] Download and open Notebox
- [ ] Try creating a new scratch tab with **Ctrl+T**
- [ ] Select your favorite theme palette from the switcher
- [ ] Pin your most important notes with **Ctrl+Shift+P**

---

*Enjoy writing with Notebox!*
"#;

            if let Ok(()) = fs::write(&welcome_file_path, welcome_content) {
                let preview = "Your notes, ideas, and knowledge in one place. Notebox helps you capture thoughts quickly...";
                let word_count = welcome_content.split_whitespace().count();
                let char_count = welcome_content.chars().count();

                let _ = conn.execute(
                    "INSERT INTO notes (id, title, folder_id, file_path, pinned, preview, word_count, char_count, has_checklist) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 1)",
                    (
                        &welcome_id,
                        "Welcome to Notebox",
                        &personal_id,
                        welcome_rel_path,
                        1, // pinned by default
                        preview,
                        word_count as i64,
                        char_count as i64,
                    ),
                );

                // Add to FTS
                let _ = conn.execute(
                    "INSERT INTO notes_fts (note_id, title, content, tags) VALUES (?1, ?2, ?3, ?4)",
                    (&welcome_id, "Welcome to Notebox", welcome_content, "#welcome #notebox"),
                );
            }
        }

        Ok(())
    }
}

pub fn default_vault_path() -> PathBuf {
    let docs_notebox = dirs::document_dir().map(|d| d.join("Notebox"));
    let docs_noteflow = dirs::document_dir().map(|d| d.join("NoteFlow"));

    if let Some(ref nb) = docs_notebox {
        if nb.exists() {
            return nb.clone();
        }
    }
    if let Some(ref nf) = docs_noteflow {
        if nf.exists() {
            if let Some(ref nb) = docs_notebox {
                let _ = fs::rename(nf, nb);
                if nb.exists() {
                    return nb.clone();
                }
            }
            return nf.clone();
        }
    }
    if let Some(nb) = docs_notebox {
        return nb;
    }
    if let Some(home) = dirs::home_dir() {
        let home_nb = home.join("Notebox");
        let home_nf = home.join("NoteFlow");
        if home_nb.exists() {
            return home_nb;
        }
        if home_nf.exists() {
            let _ = fs::rename(&home_nf, &home_nb);
            if home_nb.exists() {
                return home_nb;
            }
            return home_nf;
        }
        return home_nb;
    }
    PathBuf::from("Notebox")
}

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
        let noteflow_dir = vault_path.join(".noteflow");
        let assets_dir = vault_path.join(".assets").join("images");
        
        fs::create_dir_all(&vault_path).map_err(|e| format!("Failed to create vault dir: {}", e))?;
        fs::create_dir_all(&noteflow_dir).map_err(|e| format!("Failed to create .noteflow dir: {}", e))?;
        fs::create_dir_all(&assets_dir).map_err(|e| format!("Failed to create assets dir: {}", e))?;

        let db_path = noteflow_dir.join("noteflow.db");
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

        let db = Self {
            conn: Mutex::new(conn),
            vault_path,
        };

        db.seed_defaults()?;
        Ok(db)
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
            let welcome_rel_path = "Personal/Welcome to NoteFlow.md";
            let welcome_file_path = self.vault_path.join(welcome_rel_path);

            let welcome_content = r#"# 🗒️ Welcome to NoteFlow!

NoteFlow is your **super-lightweight**, local-first desktop note app designed with the elegance of **macOS Apple Notes**, the speed & instant session restore of **Windows 11 Notepad**, and the filesystem freedom of **Obsidian**.

---

### ✨ What Makes NoteFlow Special?

1. **Instant Session Restore (Notepad-style)**
   - Close NoteFlow at any moment — even without saving!
   - Every tab, unsaved scratch note, cursor position, and scroll location is restored instantly.
   - Zero "Do you want to save before exiting?" annoying dialogs. Auto-saves continuously in the background!

2. **Apple Notes 3-Column Experience**
   - Three sleek columns: **Folders & Tags** ➔ **Note List Cards** ➔ **Distraction-Free Editor**.
   - Gorgeous warm Apple Notes Light Mode and deep Charcoal Dark Mode.

3. **Obsidian-Style Freedom**
   - All notes are plain **Markdown (.md)** files inside your vault folder.
   - You can open, edit, sync, or git-commit your notes anytime using any tool.
   - Link notes together using `[[Note Title]]` wiki-links!

---

### 🚀 Interactive Checklist Example
- [x] Download and open NoteFlow
- [ ] Try creating a new scratch tab with **Ctrl+T**
- [ ] Insert a table or image
- [ ] Toggle dark mode with **Ctrl+Shift+D**
- [ ] Pin your most important notes with **Ctrl+Shift+P**

### 📊 Quick Comparison

| Feature | Windows 11 Notepad | Apple Notes | NoteFlow |
| :--- | :---: | :---: | :---: |
| Tabs & Session Restore | ✅ | ❌ | ✅ |
| Ultra-Fast & Lightweight | ✅ | ✅ | ✅ |
| Rich Formatting & Tables | ❌ | ✅ | ✅ |
| Checklists & Images | ❌ | ✅ | ✅ |
| Local Markdown Files | ❌ | ❌ | ✅ |
| Full-Text Instant Search | ❌ | ✅ | ✅ (FTS5) |

---

*Enjoy writing with NoteFlow!*
"#;

            if let Ok(()) = fs::write(&welcome_file_path, welcome_content) {
                let preview = "NoteFlow is your super-lightweight, local-first desktop note app designed with the elegance of macOS Apple Notes...";
                let word_count = welcome_content.split_whitespace().count();
                let char_count = welcome_content.chars().count();

                let _ = conn.execute(
                    "INSERT INTO notes (id, title, folder_id, file_path, pinned, preview, word_count, char_count) 
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                    (
                        &welcome_id,
                        "Welcome to NoteFlow!",
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
                    (&welcome_id, "Welcome to NoteFlow!", welcome_content, "#welcome #noteflow"),
                );
            }
        }

        Ok(())
    }
}

pub fn default_vault_path() -> PathBuf {
    if let Some(docs) = dirs::document_dir() {
        docs.join("NoteFlow")
    } else if let Some(home) = dirs::home_dir() {
        home.join("NoteFlow")
    } else {
        PathBuf::from("NoteFlow")
    }
}

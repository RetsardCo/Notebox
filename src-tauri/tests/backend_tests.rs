#[cfg(test)]
mod tests {
    use noteflow_lib::commands::crypto;
    use noteflow_lib::db::Database;
    use noteflow_lib::models::SessionState;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_crypto_hashing_and_verification() {
        let password = "MySecretPassword123!";
        let hash = crypto::hash_password(password);
        assert!(crypto::verify_password(password, &hash));
        assert!(!crypto::verify_password("WrongPassword", &hash));
    }

    #[test]
    fn test_crypto_encryption_and_decryption_with_random_nonces() {
        let password = "StrongPassword456";
        let content = "# Secret Meeting Notes\nConfidential project details here.";

        // Encrypt twice with the same password and content
        let encrypted1 = crypto::encrypt_content(content, password).expect("Encryption 1 failed");
        let encrypted2 = crypto::encrypt_content(content, password).expect("Encryption 2 failed");

        // Nonce must be random: ciphertexts must be distinct (prevents AES-GCM nonce reuse attack)
        assert_ne!(encrypted1, encrypted2);

        // Both must decrypt correctly to the original content
        let decrypted1 = crypto::decrypt_content(&encrypted1, password).expect("Decryption 1 failed");
        let decrypted2 = crypto::decrypt_content(&encrypted2, password).expect("Decryption 2 failed");
        assert_eq!(content, decrypted1);
        assert_eq!(content, decrypted2);

        // Wrong password should fail
        assert!(crypto::decrypt_content(&encrypted1, "BadPassword").is_err());
    }

    #[test]
    fn test_database_initialization_and_seeding() {
        let dir = tempdir().expect("Failed to create tempdir");
        let vault = dir.path().to_path_buf();
        let db = Database::new(vault.clone()).expect("Failed to init database");

        // Verify default folders created
        let conn = db.lock();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM folders", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 3);

        // Verify welcome note was created with has_checklist = 1
        let note_count: i64 = conn.query_row("SELECT COUNT(*) FROM notes", [], |r| r.get(0)).unwrap();
        assert_eq!(note_count, 1);

        let has_check: i64 = conn.query_row("SELECT has_checklist FROM notes LIMIT 1", [], |r| r.get(0)).unwrap();
        assert_eq!(has_check, 1);

        // Verify FTS table works
        let fts_count: i64 = conn.query_row("SELECT COUNT(*) FROM notes_fts WHERE notes_fts MATCH 'NoteFlow'", [], |r| r.get(0)).unwrap();
        assert!(fts_count >= 1);
    }

    #[test]
    fn test_checklist_smart_folder_filtering() {
        let dir = tempdir().expect("Failed to create tempdir");
        let vault = dir.path().to_path_buf();
        let db = Database::new(vault.clone()).expect("Failed to init database");
        let conn = db.lock();

        // Welcome note already has checklist
        let checklist_notes: i64 = conn.query_row(
            "SELECT COUNT(*) FROM notes WHERE is_trash = 0 AND has_checklist = 1",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(checklist_notes, 1);

        // Insert a plain note without checklist
        let note_id = "test-plain-note";
        let _ = conn.execute(
            "INSERT INTO notes (id, title, file_path, has_checklist, is_trash) VALUES (?1, 'Plain Note', 'plain.md', 0, 0)",
            [note_id],
        );

        let checklist_notes2: i64 = conn.query_row(
            "SELECT COUNT(*) FROM notes WHERE is_trash = 0 AND has_checklist = 1",
            [],
            |r| r.get(0),
        ).unwrap();
        assert_eq!(checklist_notes2, 1); // Plain note was not included!
    }

    #[test]
    fn test_trash_auto_purge() {
        let dir = tempdir().expect("Failed to create tempdir");
        let vault = dir.path().to_path_buf();
        let db = Database::new(vault.clone()).expect("Failed to init database");

        let old_note_file = vault.join("old_deleted.md");
        fs::write(&old_note_file, "old note content").unwrap();

        {
            let conn = db.lock();
            let _ = conn.execute(
                "INSERT INTO notes (id, title, file_path, is_trash, updated_at) 
                 VALUES ('old-trash-note', 'Old Trash', 'old_deleted.md', 1, datetime('now', '-35 days'))",
                [],
            );
        }

        assert!(old_note_file.exists());

        // Run purge
        let purged = db.purge_old_trash();
        assert_eq!(purged, 1);

        // File should be deleted from disk
        assert!(!old_note_file.exists());

        let conn = db.lock();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM notes WHERE id = 'old-trash-note'", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 0);
    }

    #[test]
    fn test_session_state_json_roundtrip() {
        let json_str = r#"{
            "tabs": [
                {
                    "id": "tab-1",
                    "note_id": "note-123",
                    "title": "My Note",
                    "content": "Live unsaved content",
                    "is_dirty": true,
                    "cursor_line": 5,
                    "cursor_ch": 10,
                    "scroll_top": 120.5
                }
            ],
            "active_tab_id": "tab-1",
            "sidebar_width": 240,
            "note_list_width": 290,
            "sidebar_collapsed": false,
            "note_list_collapsed": false,
            "selected_folder_id": null,
            "selected_tag": null,
            "selected_smart_folder": null,
            "theme": "dark",
            "view_mode": "list",
            "word_wrap": true,
            "font_size": 15
        }"#;

        let session: SessionState = serde_json::from_str(json_str).expect("Failed to deserialize session");
        assert_eq!(session.tabs.len(), 1);
        assert_eq!(session.tabs[0].title, "My Note");
        assert!(session.tabs[0].is_dirty);
        assert_eq!(session.theme, "dark");

        let serialized = serde_json::to_string_pretty(&session).expect("Failed to serialize session");
        let roundtrip: SessionState = serde_json::from_str(&serialized).expect("Failed to deserialize roundtrip");
        assert_eq!(roundtrip.tabs[0].content, "Live unsaved content");
    }
}

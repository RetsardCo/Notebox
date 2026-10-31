#[cfg(test)]
mod tests {
    use noteflow_lib::commands::crypto;
    use noteflow_lib::db::Database;
    use noteflow_lib::models::SessionState;
    use tempfile::tempdir;

    #[test]
    fn test_crypto_hashing_and_verification() {
        let password = "MySecretPassword123!";
        let hash = crypto::hash_password(password);
        assert!(crypto::verify_password(password, &hash));
        assert!(!crypto::verify_password("WrongPassword", &hash));
    }

    #[test]
    fn test_crypto_encryption_and_decryption() {
        let password = "StrongPassword456";
        let content = "# Secret Meeting Notes\nConfidential project details here.";
        let encrypted = crypto::encrypt_content(content, password).expect("Encryption failed");
        assert_ne!(content, encrypted);

        let decrypted = crypto::decrypt_content(&encrypted, password).expect("Decryption failed");
        assert_eq!(content, decrypted);

        // Wrong password should fail
        assert!(crypto::decrypt_content(&encrypted, "BadPassword").is_err());
    }

    #[test]
    fn test_database_initialization_and_seeding() {
        let dir = tempdir().expect("Failed to create tempdir");
        let vault = dir.path().to_path_buf();
        let db = Database::new(vault.clone()).expect("Failed to init database");

        // Verify that default folders were created
        let conn = db.lock();
        let count: i64 = conn.query_row("SELECT COUNT(*) FROM folders", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 3);

        // Verify welcome note was created
        let note_count: i64 = conn.query_row("SELECT COUNT(*) FROM notes", [], |r| r.get(0)).unwrap();
        assert_eq!(note_count, 1);

        // Verify FTS table works
        let fts_count: i64 = conn.query_row("SELECT COUNT(*) FROM notes_fts WHERE notes_fts MATCH 'NoteFlow'", [], |r| r.get(0)).unwrap();
        assert!(fts_count >= 1);
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

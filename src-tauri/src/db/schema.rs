pub const CREATE_FOLDERS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    icon TEXT DEFAULT '📁',
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
);
"#;

pub const CREATE_NOTES_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'Untitled',
    folder_id TEXT,
    file_path TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pinned BOOLEAN DEFAULT 0,
    locked BOOLEAN DEFAULT 0,
    password_hash TEXT,
    is_trash BOOLEAN DEFAULT 0,
    has_checklist BOOLEAN DEFAULT 0,
    word_count INTEGER DEFAULT 0,
    char_count INTEGER DEFAULT 0,
    preview TEXT DEFAULT '',
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
);
"#;

pub const CREATE_TAGS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#e5a823'
);
"#;

pub const CREATE_NOTE_TAGS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS note_tags (
    note_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (note_id, tag_id),
    FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);
"#;

pub const CREATE_SMART_FOLDERS_TABLE: &str = r#"
CREATE TABLE IF NOT EXISTS smart_folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filter_type TEXT NOT NULL,
    filter_json TEXT NOT NULL,
    icon TEXT DEFAULT '🔍'
);
"#;

pub const CREATE_FTS_TABLE: &str = r#"
CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    note_id UNINDEXED,
    title,
    content,
    tags
);
"#;

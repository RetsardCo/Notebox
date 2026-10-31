use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteSummary {
    pub id: String,
    pub title: String,
    pub folder_id: Option<String>,
    pub folder_name: Option<String>,
    pub file_path: String,
    pub created_at: String,
    pub updated_at: String,
    pub pinned: bool,
    pub locked: bool,
    pub is_trash: bool,
    pub preview: String,
    pub word_count: usize,
    pub char_count: usize,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteDetail {
    pub id: String,
    pub title: String,
    pub folder_id: Option<String>,
    pub folder_name: Option<String>,
    pub file_path: String,
    pub content: String,
    pub created_at: String,
    pub updated_at: String,
    pub pinned: bool,
    pub locked: bool,
    pub is_trash: bool,
    pub word_count: usize,
    pub char_count: usize,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub note_id: String,
    pub title: String,
    pub snippet: String,
    pub folder_name: Option<String>,
    pub updated_at: String,
    pub match_type: String,
}

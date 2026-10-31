use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Folder {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub icon: String,
    pub sort_order: i32,
    pub note_count: usize,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SmartFolder {
    pub id: String,
    pub name: String,
    pub filter_type: String,
    pub filter_json: String,
    pub icon: String,
}

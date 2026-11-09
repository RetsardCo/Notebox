use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabState {
    pub id: String,
    pub note_id: Option<String>,
    pub title: String,
    pub content: String,
    pub is_dirty: bool,
    #[serde(default)]
    pub cursor_line: usize,
    #[serde(default)]
    pub cursor_ch: usize,
    #[serde(default)]
    pub scroll_top: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionState {
    pub tabs: Vec<TabState>,
    pub active_tab_id: Option<String>,
    #[serde(default = "default_sidebar_width")]
    pub sidebar_width: u32,
    #[serde(default = "default_notelist_width")]
    pub note_list_width: u32,
    #[serde(default)]
    pub sidebar_collapsed: bool,
    #[serde(default)]
    pub note_list_collapsed: bool,
    pub selected_folder_id: Option<String>,
    pub selected_tag: Option<String>,
    pub selected_smart_folder: Option<String>,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_view_mode")]
    pub view_mode: String,
    #[serde(default = "default_word_wrap")]
    pub word_wrap: bool,
    #[serde(default = "default_font_size")]
    pub font_size: u32,
    #[serde(default = "default_startup_view")]
    pub startup_view: String,
    #[serde(default = "default_true")]
    pub confirm_tag_delete: bool,
    #[serde(default = "default_true")]
    pub confirm_permanent_delete: bool,
}

fn default_sidebar_width() -> u32 { 240 }
fn default_notelist_width() -> u32 { 300 }
fn default_theme() -> String { "warm-paper".to_string() }
fn default_view_mode() -> String { "list".to_string() }
fn default_word_wrap() -> bool { true }
fn default_font_size() -> u32 { 15 }
fn default_startup_view() -> String { "all".to_string() }
fn default_true() -> bool { true }

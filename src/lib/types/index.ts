export interface NoteSummary {
  id: string;
  title: string;
  folder_id: string | null;
  folder_name: string | null;
  file_path: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  locked: boolean;
  is_trash: boolean;
  preview: string;
  word_count: number;
  char_count: number;
  tags: string[];
}

export interface NoteDetail {
  id: string;
  title: string;
  folder_id: string | null;
  folder_name: string | null;
  file_path: string;
  content: string;
  created_at: string;
  updated_at: string;
  pinned: boolean;
  locked: boolean;
  is_trash: boolean;
  word_count: number;
  char_count: number;
  tags: string[];
}

export interface Folder {
  id: string;
  name: string;
  parent_id: string | null;
  icon: string;
  sort_order: number;
  note_count: number;
  created_at: string;
}

export interface SmartFolder {
  id: string;
  name: string;
  filter_type: string;
  filter_json: string;
  icon: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  note_count: number;
}

export interface TabState {
  id: string;
  note_id: string | null; // null for untitled scratchpad note
  title: string;
  content: string;
  is_dirty: boolean;
  cursor_line: number;
  cursor_ch: number;
  scroll_top: number;
}

export interface SessionState {
  tabs: TabState[];
  active_tab_id: string | null;
  sidebar_width: number;
  note_list_width: number;
  sidebar_collapsed: boolean;
  note_list_collapsed: boolean;
  selected_folder_id: string | null;
  selected_tag: string | null;
  selected_smart_folder: string | null;
  theme: 'light' | 'dark' | 'system';
  view_mode: 'list' | 'gallery';
  word_wrap: boolean;
  font_size: number;
}

export interface SearchResult {
  note_id: string;
  title: string;
  snippet: string;
  folder_name: string | null;
  updated_at: string;
  match_type: string;
}

export type SortOption = 'updated' | 'created' | 'title';
export type ViewMode = 'list' | 'gallery';
export type Theme = 'light' | 'dark' | 'system';

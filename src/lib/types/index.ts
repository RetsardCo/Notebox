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
  has_checklist: boolean;
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
  has_checklist: boolean;
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
  theme: string;
  view_mode: 'list' | 'gallery';
  word_wrap: boolean;
  font_size: number;
  startup_view?: 'all' | 'pinned' | 'last_session';
  confirm_tag_delete?: boolean;
  confirm_permanent_delete?: boolean;
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
export type Theme =
  | 'warm-paper'
  | 'midnight'
  | 'forest'
  | 'ocean'
  | 'lavender'
  | 'sunset'
  | 'light'
  | 'dark'
  | 'system';

export interface PaletteInfo {
  id: 'warm-paper' | 'midnight' | 'forest' | 'ocean' | 'lavender' | 'sunset';
  name: string;
  type: 'light' | 'dark';
  description: string;
  dots: string[];
  accent: string;
  bg: string;
  text: string;
}

export const PALETTES: PaletteInfo[] = [
  {
    id: 'warm-paper',
    name: 'Warm Paper',
    type: 'light',
    description: 'A calm, comfortable space for focused writing.',
    dots: ['#fbf8f2', '#f3ede2', '#d7c3b0', '#c48137', '#2c221e'],
    accent: '#c48137',
    bg: '#fbf8f2',
    text: '#2c221e',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    type: 'dark',
    description: 'A sleek, modern dark theme with depth and contrast.',
    dots: ['#f1f5f9', '#38bdf8', '#64748b', '#1c2633', '#121820'],
    accent: '#38bdf8',
    bg: '#121820',
    text: '#f1f5f9',
  },
  {
    id: 'forest',
    name: 'Forest',
    type: 'dark',
    description: 'A refreshing, nature-inspired theme for a balanced workflow.',
    dots: ['#ecfdf5', '#10b981', '#689780', '#1a2e24', '#101c16'],
    accent: '#10b981',
    bg: '#101c16',
    text: '#ecfdf5',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    type: 'light',
    description: 'A clean and airy theme with a cool, modern look.',
    dots: ['#0c2338', '#0284c7', '#62809e', '#e2ecf5', '#ffffff'],
    accent: '#0284c7',
    bg: '#f0f5fa',
    text: '#0c2338',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    type: 'light',
    description: 'A soft, creative theme that’s easy on the eyes.',
    dots: ['#281438', '#8b5cf6', '#82659e', '#ece4f4', '#ffffff'],
    accent: '#8b5cf6',
    bg: '#f8f4fb',
    text: '#281438',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    type: 'dark',
    description: 'A warm, vibrant theme with a bold yet elegant feel.',
    dots: ['#fdf2f4', '#f97316', '#d6a8b4', '#35252c', '#22181c'],
    accent: '#f97316',
    bg: '#22181c',
    text: '#fdf2f4',
  },
];

import { invoke } from '@tauri-apps/api/core';
import type {
  NoteSummary,
  NoteDetail,
  Folder,
  SmartFolder,
  Tag,
  SessionState,
  SearchResult,
  SortOption,
} from '../types';

export const isTauri = typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

async function safeInvoke<T>(cmd: string, args?: any, fallback?: T): Promise<T> {
  if (isTauri) {
    try {
      return await invoke<T>(cmd, args);
    } catch (e) {
      console.warn(`Tauri invoke('${cmd}') failed:`, e);
      if (fallback !== undefined) return fallback;
      throw e;
    }
  }
  return fallback as T;
}

const mockNotes: NoteSummary[] = [
  {
    id: 'note-welcome',
    title: 'Welcome to NoteFlow',
    folder_id: 'folder-personal',
    folder_name: 'Personal',
    file_path: 'Welcome to NoteFlow.md',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pinned: false,
    locked: false,
    is_trash: false,
    preview: 'No additional text',
    word_count: 0,
    char_count: 0,
    tags: [],
  },
  {
    id: 'note-untitled',
    title: 'Untitled Note',
    folder_id: null,
    folder_name: null,
    file_path: 'Untitled Note.md',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    pinned: false,
    locked: false,
    is_trash: false,
    preview: 'No additional text',
    word_count: 0,
    char_count: 0,
    tags: [],
  },
];

const mockFolders: Folder[] = [
  { id: 'folder-personal', name: 'Personal', parent_id: null, icon: 'folder', sort_order: 0, note_count: 1, created_at: new Date().toISOString() },
  { id: 'folder-work', name: 'Work', parent_id: null, icon: 'folder', sort_order: 1, note_count: 0, created_at: new Date().toISOString() },
];

export const noteService = {
  createNote: async (folderId?: string | null, title?: string, content?: string): Promise<NoteSummary> => {
    const fallback: NoteSummary = {
      id: 'note-' + Date.now(),
      title: title || 'Untitled Note',
      folder_id: folderId ?? null,
      folder_name: folderId === 'folder-personal' ? 'Personal' : (folderId === 'folder-work' ? 'Work' : null),
      file_path: `${title || 'Untitled'}.md`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      pinned: false,
      locked: false,
      is_trash: false,
      preview: 'No additional text',
      word_count: 0,
      char_count: 0,
      tags: [],
    };
    mockNotes.unshift(fallback);
    return safeInvoke('create_note', { folderId: folderId ?? null, title: title ?? null, content: content ?? null }, fallback);
  },

  readNote: async (id: string): Promise<NoteDetail> => {
    const found = mockNotes.find((n) => n.id === id);
    const fallback: NoteDetail = {
      id,
      title: found?.title || 'Untitled Note',
      folder_id: found?.folder_id ?? null,
      folder_name: found?.folder_name ?? null,
      file_path: found?.file_path || 'Untitled.md',
      content: '',
      created_at: found?.created_at || new Date().toISOString(),
      updated_at: found?.updated_at || new Date().toISOString(),
      pinned: found?.pinned || false,
      locked: found?.locked || false,
      is_trash: found?.is_trash || false,
      word_count: 0,
      char_count: 0,
      tags: found?.tags || [],
    };
    return safeInvoke('read_note', { id }, fallback);
  },

  saveNote: async (id: string, content: string, title?: string): Promise<NoteSummary> => {
    const found = mockNotes.find((n) => n.id === id);
    if (found) {
      if (title) found.title = title;
      found.updated_at = new Date().toISOString();
    }
    const fallback = found || mockNotes[0];
    return safeInvoke('save_note', { id, content, title: title ?? null }, fallback);
  },

  deleteNote: async (id: string, permanent: boolean = false): Promise<void> => {
    return safeInvoke('delete_note', { id, permanent });
  },

  restoreNote: async (id: string): Promise<void> => {
    return safeInvoke('restore_note', { id });
  },

  moveNote: async (id: string, folderId: string | null): Promise<void> => {
    return safeInvoke('move_note', { id, folderId });
  },

  pinNote: async (id: string, pinned: boolean): Promise<void> => {
    return safeInvoke('pin_note', { id, pinned });
  },

  lockNote: async (id: string, password: string): Promise<void> => {
    return safeInvoke('lock_note', { id, password });
  },

  unlockNote: async (id: string, password: string): Promise<NoteDetail> => {
    return safeInvoke('unlock_note', { id, password });
  },

  removeNoteLock: async (id: string, password: string): Promise<void> => {
    return safeInvoke('remove_note_lock', { id, password });
  },

  duplicateNote: async (id: string): Promise<NoteSummary> => {
    return safeInvoke('duplicate_note', { id }, mockNotes[0]);
  },

  getNotes: async (
    folderId?: string | null,
    tag?: string | null,
    filterType?: string | null,
    sortBy?: SortOption,
  ): Promise<NoteSummary[]> => {
    return safeInvoke('get_notes', {
      folderId: folderId ?? null,
      tag: tag ?? null,
      filterType: filterType ?? null,
      sortBy: sortBy ?? 'updated',
    }, [...mockNotes]);
  },

  emptyTrash: async (): Promise<number> => {
    return safeInvoke('empty_trash', undefined, 0);
  },

  exportNote: async (id: string, format: string): Promise<string> => {
    return safeInvoke('export_note', { id, format }, '');
  },
};

export const folderService = {
  getFolders: async (): Promise<Folder[]> => {
    return safeInvoke('get_folders', undefined, [...mockFolders]);
  },

  createFolder: async (name: string, parentId?: string | null, icon?: string): Promise<Folder> => {
    const fallback: Folder = {
      id: 'folder-' + Date.now(),
      name,
      parent_id: parentId ?? null,
      icon: icon ?? 'folder',
      sort_order: mockFolders.length,
      note_count: 0,
      created_at: new Date().toISOString(),
    };
    mockFolders.push(fallback);
    return safeInvoke('create_folder', { name, parentId: parentId ?? null, icon: icon ?? null }, fallback);
  },

  renameFolder: async (id: string, name: string): Promise<void> => {
    const f = mockFolders.find((x) => x.id === id);
    if (f) f.name = name;
    return safeInvoke('rename_folder', { id, name });
  },

  deleteFolder: async (id: string): Promise<void> => {
    return safeInvoke('delete_folder', { id });
  },

  getSmartFolders: async (): Promise<SmartFolder[]> => {
    const fallback: SmartFolder[] = [
      { id: 'all', name: 'All Notes', filter_type: 'all', filter_json: '', icon: 'file-text' },
      { id: 'pinned', name: 'Pinned', filter_type: 'pinned', filter_json: '', icon: 'pin' },
      { id: 'checklist', name: 'Checklists', filter_type: 'checklist', filter_json: '', icon: 'check-square' },
    ];
    return safeInvoke('get_smart_folders', undefined, fallback);
  },

  createSmartFolder: async (name: string, filterType: string, filterJson: string, icon?: string): Promise<SmartFolder> => {
    return safeInvoke('create_smart_folder', { name, filterType, filterJson, icon: icon ?? null });
  },

  deleteSmartFolder: async (id: string): Promise<void> => {
    return safeInvoke('delete_smart_folder', { id });
  },
};

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    return safeInvoke('get_tags', undefined, []);
  },

  createTag: async (name: string, color?: string): Promise<Tag> => {
    return safeInvoke('create_tag', { name, color: color ?? null }, { id: 'tag-1', name, color: color || '#8b5cf6', note_count: 0 });
  },

  deleteTag: async (id: string): Promise<void> => {
    return safeInvoke('delete_tag', { id });
  },
};

export const searchService = {
  searchNotes: async (query: string, folderId?: string | null): Promise<SearchResult[]> => {
    return safeInvoke('search_notes', { query, folderId: folderId ?? null }, []);
  },
};

export const imageService = {
  pasteImage: async (noteId: string, base64Data: string, extension?: string): Promise<string> => {
    return safeInvoke('paste_image', { noteId, base64Data, extension: extension ?? 'png' }, '');
  },

  importImage: async (noteId: string, filePath: string): Promise<string> => {
    return safeInvoke('import_image', { noteId, filePath }, '');
  },

  getImageData: async (relativePath: string): Promise<string> => {
    return safeInvoke('get_image_data', { relativePath }, '');
  },
};

export const sessionService = {
  getSession: async (): Promise<SessionState | null> => {
    return safeInvoke('get_session', undefined, null);
  },

  saveSession: async (session: SessionState): Promise<void> => {
    return safeInvoke('save_session', { session });
  },

  getVaultPath: async (): Promise<string> => {
    return safeInvoke('get_vault_path', undefined, 'C:\\Users\\Kurados\\Documents\\Notebox');
  },
};

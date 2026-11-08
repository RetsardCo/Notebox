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
    has_checklist: true,
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
    has_checklist: false,
    preview: 'No additional text',
    word_count: 0,
    char_count: 0,
    tags: ['work', 'personal'],
  },
  {
    id: 'note-sample-deleted',
    title: 'Archived Meeting Brief',
    folder_id: null,
    folder_name: null,
    file_path: 'Archived Meeting Brief.md',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    pinned: false,
    locked: false,
    is_trash: true,
    has_checklist: false,
    preview: 'Summary notes from the planning session and product feedback.',
    word_count: 85,
    char_count: 512,
    tags: ['work'],
  },
];

const mockFolders: Folder[] = [
  { id: 'folder-personal', name: 'Personal', parent_id: null, icon: 'folder', sort_order: 0, note_count: 1, created_at: new Date().toISOString() },
  { id: 'folder-work', name: 'Work', parent_id: null, icon: 'folder', sort_order: 1, note_count: 0, created_at: new Date().toISOString() },
];

const mockTags: Tag[] = [
  { id: 'tag-work', name: 'work', color: '#8b5cf6', note_count: 2 },
  { id: 'tag-personal', name: 'personal', color: '#ec4899', note_count: 1 },
  { id: 'tag-ideas', name: 'ideas', color: '#10b981', note_count: 3 },
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
      has_checklist: false,
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
      has_checklist: found?.has_checklist || false,
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
    if (permanent) {
      const idx = mockNotes.findIndex((n) => n.id === id);
      if (idx !== -1) mockNotes.splice(idx, 1);
    } else {
      const n = mockNotes.find((x) => x.id === id);
      if (n) n.is_trash = true;
    }
    return safeInvoke('delete_note', { id, permanent });
  },

  restoreNote: async (id: string): Promise<void> => {
    const n = mockNotes.find((x) => x.id === id);
    if (n) {
      n.is_trash = false;
      if (n.folder_id && !mockFolders.some((f) => f.id === n.folder_id)) {
        n.folder_id = null;
        n.folder_name = null;
      }
    }
    return safeInvoke('restore_note', { id });
  },

  moveNote: async (id: string, folderId: string | null): Promise<void> => {
    const n = mockNotes.find((x) => x.id === id);
    if (n) {
      n.folder_id = folderId;
      n.folder_name = mockFolders.find((f) => f.id === folderId)?.name || null;
    }
    return safeInvoke('move_note', { id, folderId });
  },

  pinNote: async (id: string, pinned: boolean): Promise<void> => {
    const n = mockNotes.find((x) => x.id === id);
    if (n) n.pinned = pinned;
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
    let filtered = [...mockNotes];
    if (filterType === 'trash') {
      filtered = filtered.filter((n) => n.is_trash);
    } else {
      filtered = filtered.filter((n) => !n.is_trash);
      if (filterType === 'pinned') {
        filtered = filtered.filter((n) => n.pinned);
      } else if (filterType === 'checklist') {
        filtered = filtered.filter((n) => n.has_checklist);
      }
      if (folderId) {
        filtered = filtered.filter((n) => n.folder_id === folderId);
      }
      if (tag) {
        filtered = filtered.filter((n) => n.tags?.some((t) => t.toLowerCase() === tag.toLowerCase()));
      }
    }
    return safeInvoke('get_notes', {
      folderId: folderId ?? null,
      tag: tag ?? null,
      filterType: filterType ?? null,
      sortBy: sortBy ?? 'updated',
    }, filtered);
  },

  emptyTrash: async (): Promise<number> => {
    let count = 0;
    for (let i = mockNotes.length - 1; i >= 0; i--) {
      if (mockNotes[i].is_trash) {
        mockNotes.splice(i, 1);
        count++;
      }
    }
    return safeInvoke('empty_trash', undefined, count);
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
    return safeInvoke('get_tags', undefined, mockTags);
  },

  createTag: async (name: string, color?: string): Promise<Tag> => {
    const t: Tag = { id: 'tag-' + Date.now(), name, color: color || '#8b5cf6', note_count: 0 };
    mockTags.push(t);
    return safeInvoke('create_tag', { name, color: color ?? null }, t);
  },

  updateTag: async (id: string, name?: string, color?: string): Promise<Tag> => {
    const t = mockTags.find((x) => x.id === id);
    const oldName = t?.name;
    if (t) {
      if (name) t.name = name;
      if (color) t.color = color;
    }
    if (oldName && name) {
      for (const n of mockNotes) {
        n.tags = n.tags.map((tag) => (tag.toLowerCase() === oldName.toLowerCase() ? name : tag));
      }
    }
    return safeInvoke('update_tag', { id, name: name ?? null, color: color ?? null }, t || { id, name: name || 'tag', color: color || '#8b5cf6', note_count: 0 });
  },

  deleteTag: async (id: string): Promise<void> => {
    const idx = mockTags.findIndex((x) => x.id === id);
    let tagName = '';
    if (idx !== -1) {
      tagName = mockTags[idx].name;
      mockTags.splice(idx, 1);
    }
    if (tagName) {
      for (const n of mockNotes) {
        n.tags = n.tags.filter((t) => t.toLowerCase() !== tagName.toLowerCase());
      }
    }
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

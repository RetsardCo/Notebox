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

export const noteService = {
  createNote: async (folderId?: string | null, title?: string, content?: string): Promise<NoteSummary> => {
    return invoke('create_note', { folderId: folderId ?? null, title: title ?? null, content: content ?? null });
  },

  readNote: async (id: string): Promise<NoteDetail> => {
    return invoke('read_note', { id });
  },

  saveNote: async (id: string, content: string, title?: string): Promise<NoteSummary> => {
    return invoke('save_note', { id, content, title: title ?? null });
  },

  deleteNote: async (id: string, permanent: boolean = false): Promise<void> => {
    return invoke('delete_note', { id, permanent });
  },

  restoreNote: async (id: string): Promise<void> => {
    return invoke('restore_note', { id });
  },

  moveNote: async (id: string, folderId: string | null): Promise<void> => {
    return invoke('move_note', { id, folderId });
  },

  pinNote: async (id: string, pinned: boolean): Promise<void> => {
    return invoke('pin_note', { id, pinned });
  },

  lockNote: async (id: string, password: string): Promise<void> => {
    return invoke('lock_note', { id, password });
  },

  unlockNote: async (id: string, password: string): Promise<NoteDetail> => {
    return invoke('unlock_note', { id, password });
  },

  removeNoteLock: async (id: string, password: string): Promise<void> => {
    return invoke('remove_note_lock', { id, password });
  },

  duplicateNote: async (id: string): Promise<NoteSummary> => {
    return invoke('duplicate_note', { id });
  },

  getNotes: async (
    folderId?: string | null,
    tag?: string | null,
    filterType?: string | null,
    sortBy?: SortOption,
  ): Promise<NoteSummary[]> => {
    return invoke('get_notes', {
      folderId: folderId ?? null,
      tag: tag ?? null,
      filterType: filterType ?? null,
      sortBy: sortBy ?? 'updated',
    });
  },

  emptyTrash: async (): Promise<number> => {
    return invoke('empty_trash');
  },

  exportNote: async (id: string, format: string): Promise<string> => {
    return invoke('export_note', { id, format });
  },
};

export const folderService = {
  getFolders: async (): Promise<Folder[]> => {
    return invoke('get_folders');
  },

  createFolder: async (name: string, parentId?: string | null, icon?: string): Promise<Folder> => {
    return invoke('create_folder', { name, parentId: parentId ?? null, icon: icon ?? null });
  },

  renameFolder: async (id: string, name: string): Promise<void> => {
    return invoke('rename_folder', { id, name });
  },

  deleteFolder: async (id: string): Promise<void> => {
    return invoke('delete_folder', { id });
  },

  getSmartFolders: async (): Promise<SmartFolder[]> => {
    return invoke('get_smart_folders');
  },

  createSmartFolder: async (name: string, filterType: string, filterJson: string, icon?: string): Promise<SmartFolder> => {
    return invoke('create_smart_folder', { name, filterType, filterJson, icon: icon ?? null });
  },

  deleteSmartFolder: async (id: string): Promise<void> => {
    return invoke('delete_smart_folder', { id });
  },
};

export const tagService = {
  getTags: async (): Promise<Tag[]> => {
    return invoke('get_tags');
  },

  createTag: async (name: string, color?: string): Promise<Tag> => {
    return invoke('create_tag', { name, color: color ?? null });
  },

  deleteTag: async (id: string): Promise<void> => {
    return invoke('delete_tag', { id });
  },
};

export const searchService = {
  searchNotes: async (query: string, folderId?: string | null): Promise<SearchResult[]> => {
    return invoke('search_notes', { query, folderId: folderId ?? null });
  },
};

export const imageService = {
  pasteImage: async (noteId: string, base64Data: string, extension?: string): Promise<string> => {
    return invoke('paste_image', { noteId, base64Data, extension: extension ?? 'png' });
  },

  importImage: async (noteId: string, filePath: string): Promise<string> => {
    return invoke('import_image', { noteId, filePath });
  },

  getImageData: async (relativePath: string): Promise<string> => {
    return invoke('get_image_data', { relativePath });
  },
};

export const sessionService = {
  getSession: async (): Promise<SessionState | null> => {
    return invoke('get_session');
  },

  saveSession: async (session: SessionState): Promise<void> => {
    return invoke('save_session', { session });
  },

  getVaultPath: async (): Promise<string> => {
    return invoke('get_vault_path');
  },
};

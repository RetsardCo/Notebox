import {
  noteService,
  folderService,
  tagService,
  searchService,
  sessionService,
} from '../services/ipc';
import type {
  NoteSummary,
  NoteDetail,
  Folder,
  SmartFolder,
  Tag,
  TabState,
  SessionState,
  SearchResult,
  SortOption,
  ViewMode,
} from '../types';
import { clampZoom, zoomIn, zoomOut, resetZoom } from '../utils/zoom';

let autoSaveTimer: any = null;
let sessionSaveTimer: any = null;

class AppStore {
  // Navigation / Selection
  notes = $state<NoteSummary[]>([]);
  folders = $state<Folder[]>([]);
  tags = $state<Tag[]>([]);
  smartFolders = $state<SmartFolder[]>([]);

  selectedFolderId = $state<string | null>(null);
  selectedTag = $state<string | null>(null);
  selectedSmartFolder = $state<string | null>('all');
  sortBy = $state<SortOption>('updated');
  viewMode = $state<ViewMode>('list');

  // Search
  searchQuery = $state<string>('');
  searchResults = $state<SearchResult[]>([]);
  isSearching = $state<boolean>(false);

  // Tabs & Notepad Session
  tabs = $state<TabState[]>([]);
  activeTabId = $state<string | null>(null);

  // UI State
  sidebarWidth = $state<number>(240);
  noteListWidth = $state<number>(300);
  sidebarCollapsed = $state<boolean>(false);
  noteListCollapsed = $state<boolean>(false);
  theme = $state<string>('lavender');
  wordWrap = $state<boolean>(true);
  fontSize = $state<number>(15);
  zoomLevel = $state<number>(100);

  // General Settings Persistence
  startupView = $state<'all' | 'pinned' | 'last_session'>('all');
  confirmTagDelete = $state<boolean>(true);
  confirmPermanentDelete = $state<boolean>(true);

  // Active Formatting Marks for Toolbar
  activeFormatting = $state<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    highlight: boolean;
    heading: string;
    bulletList: boolean;
    orderedList: boolean;
    taskList: boolean;
    blockquote: boolean;
    codeBlock: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    highlight: false,
    heading: 'p',
    bulletList: false,
    orderedList: false,
    taskList: false,
    blockquote: false,
    codeBlock: false,
  });

  // Quick Access Counts
  allCount = $state<number>(0);
  pinnedCount = $state<number>(0);
  checklistCount = $state<number>(0);
  trashCount = $state<number>(0);

  // Status Bar
  cursorLine = $state<number>(1);
  cursorCol = $state<number>(1);
  wordCount = $state<number>(0);
  charCount = $state<number>(0);
  saveStatus = $state<'saved' | 'saving' | 'dirty'>('saved');
  vaultPath = $state<string>('');

  // Modals
  settingsOpen = $state<boolean>(false);
  passwordModalOpen = $state<boolean>(false);
  passwordModalMode = $state<'lock' | 'unlock' | 'remove_lock'>('unlock');
  targetNoteForPassword = $state<NoteSummary | null>(null);
  findReplaceOpen = $state<boolean>(false);

  // Active Tab Derived
  get activeTab(): TabState | null {
    if (!this.activeTabId) return null;
    return this.tabs.find((t) => t.id === this.activeTabId) || null;
  }

  // Filtered Notes Derived
  get displayedNotes(): NoteSummary[] {
    if (this.searchQuery.trim().length > 0) {
      const matchIds = new Set(this.searchResults.map((r) => r.note_id));
      return this.notes.filter((n) => matchIds.has(n.id));
    }
    return this.notes;
  }

  // Obsidian Backlinks Derived
  get currentBacklinks(): NoteSummary[] {
    const active = this.activeTab;
    if (!active || !active.title) return [];
    const title = active.title.toLowerCase();
    return this.notes.filter((n) => {
      if (n.id === active.note_id) return false;
      return n.preview.toLowerCase().includes(`[[${title}`) || n.title.toLowerCase().includes(title);
    });
  }

  async openNoteByTitle(title: string) {
    const clean = title.trim().toLowerCase();
    const match = this.notes.find((n) => n.title.trim().toLowerCase() === clean);
    if (match) {
      await this.openNoteInTab(match.id);
    } else {
      try {
        const created = await noteService.createNote(this.selectedFolderId, title, `# ${title}\n\n`);
        await this.loadNotes();
        await this.openNoteInTab(created.id);
      } catch (e) {
        console.error('Failed to create wiki-linked note:', e);
      }
    }
  }

  async init() {
    try {
      this.vaultPath = await sessionService.getVaultPath();
    } catch (e) {
      console.warn('Could not get vault path:', e);
    }

    await this.loadFolders();
    await this.loadTags();
    await this.loadSmartFolders();
    await this.loadNotes();

    // Try restoring session
    let restored = false;
    try {
      const savedSession = await sessionService.getSession();
      if (savedSession && savedSession.tabs && savedSession.tabs.length > 0) {
        this.tabs = savedSession.tabs;
        this.activeTabId = savedSession.active_tab_id || savedSession.tabs[0].id;
        this.sidebarWidth = savedSession.sidebar_width || 240;
        this.noteListWidth = savedSession.note_list_width || 300;
        if (this.sidebarWidth < 200 || this.sidebarWidth > 420) this.sidebarWidth = 240;
        if (this.noteListWidth < 240 || this.noteListWidth > 500) this.noteListWidth = 300;
        this.sidebarCollapsed = savedSession.sidebar_collapsed || false;
        this.noteListCollapsed = savedSession.note_list_collapsed || false;
        this.startupView = savedSession.startup_view || 'all';
        this.confirmTagDelete = savedSession.confirm_tag_delete !== false;
        this.confirmPermanentDelete = savedSession.confirm_permanent_delete !== false;

        if (this.startupView === 'all') {
          this.selectedSmartFolder = 'all';
          this.selectedFolderId = null;
          this.selectedTag = null;
        } else if (this.startupView === 'pinned') {
          this.selectedSmartFolder = 'pinned';
          this.selectedFolderId = null;
          this.selectedTag = null;
        } else {
          this.selectedFolderId = savedSession.selected_folder_id;
          this.selectedTag = savedSession.selected_tag;
          this.selectedSmartFolder = (savedSession.selected_folder_id || savedSession.selected_tag) ? null : (savedSession.selected_smart_folder || 'all');
        }

        this.theme = savedSession.theme || 'lavender';
        this.viewMode = savedSession.view_mode || 'list';
        this.wordWrap = savedSession.word_wrap !== false;
        this.fontSize = savedSession.font_size || 15;
        this.applyTheme(this.theme);
        restored = true;
      } else if (savedSession) {
        this.sidebarWidth = savedSession.sidebar_width || 240;
        this.noteListWidth = savedSession.note_list_width || 300;
        if (this.sidebarWidth < 200 || this.sidebarWidth > 420) this.sidebarWidth = 240;
        if (this.noteListWidth < 240 || this.noteListWidth > 500) this.noteListWidth = 300;
        this.sidebarCollapsed = savedSession.sidebar_collapsed || false;
        this.noteListCollapsed = savedSession.note_list_collapsed || false;
        this.startupView = savedSession.startup_view || 'all';
        this.confirmTagDelete = savedSession.confirm_tag_delete !== false;
        this.confirmPermanentDelete = savedSession.confirm_permanent_delete !== false;

        if (this.startupView === 'all') {
          this.selectedSmartFolder = 'all';
          this.selectedFolderId = null;
          this.selectedTag = null;
        } else if (this.startupView === 'pinned') {
          this.selectedSmartFolder = 'pinned';
          this.selectedFolderId = null;
          this.selectedTag = null;
        } else {
          this.selectedFolderId = savedSession.selected_folder_id;
          this.selectedTag = savedSession.selected_tag;
          this.selectedSmartFolder = (savedSession.selected_folder_id || savedSession.selected_tag) ? null : (savedSession.selected_smart_folder || 'all');
        }

        this.theme = savedSession.theme || 'lavender';
        this.viewMode = savedSession.view_mode || 'list';
        this.wordWrap = savedSession.word_wrap !== false;
        this.fontSize = savedSession.font_size || 15;
        this.applyTheme(this.theme);
      }
    } catch (e) {
      console.warn('Failed to load session:', e);
    }

    // If no session restored, open the first note or create a welcome tab
    if (!restored || this.tabs.length === 0) {
      if (this.notes.length > 0) {
        await this.openNoteInTab(this.notes[0].id);
      } else {
        this.createScratchTab('Scratchpad');
      }
    }

    this.applyTheme(this.theme);
    await this.loadCounts();
  }

  applyTheme(theme: string) {
    let resolved = theme;
    if (theme === 'system' || theme === 'light') {
      if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        resolved = 'midnight';
      } else {
        resolved = 'lavender';
      }
    } else if (theme === 'dark') {
      resolved = 'midnight';
    }
    this.theme = resolved;
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', resolved);
    }
  }

  setTheme(themeId: string) {
    this.applyTheme(themeId);
    this.scheduleSessionSave();
  }

  toggleTheme() {
    const paletteOrder = ['warm-paper', 'midnight', 'forest', 'ocean', 'lavender', 'sunset'];
    const currentIndex = paletteOrder.indexOf(this.theme);
    const next = paletteOrder[(currentIndex + 1) % paletteOrder.length];
    this.setTheme(next);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    this.scheduleSessionSave();
  }

  async loadFolders() {
    try {
      this.folders = await folderService.getFolders();
    } catch (e) {
      console.error('Failed to load folders:', e);
    }
  }

  async loadTags() {
    try {
      this.tags = await tagService.getTags();
    } catch (e) {
      console.error('Failed to load tags:', e);
    }
  }

  async loadSmartFolders() {
    try {
      this.smartFolders = await folderService.getSmartFolders();
    } catch (e) {
      console.error('Failed to load smart folders:', e);
    }
  }

  async loadCounts() {
    try {
      const all = await noteService.getNotes(null, null, 'all');
      this.allCount = all.length;
      const pinned = await noteService.getNotes(null, null, 'pinned');
      this.pinnedCount = pinned.length;
      const check = await noteService.getNotes(null, null, 'checklist');
      this.checklistCount = check.length;
      const trash = await noteService.getNotes(null, null, 'trash');
      this.trashCount = trash.length;
      await this.loadTags();
    } catch (e) {
      console.warn('Failed to load counts:', e);
    }
  }

  async loadNotes() {
    try {
      const fid = this.selectedFolderId;
      const tag = this.selectedTag;
      const filterType = this.selectedSmartFolder;
      this.notes = await noteService.getNotes(fid, tag, filterType, this.sortBy);
      await this.loadCounts();
    } catch (e) {
      console.error('Failed to load notes:', e);
    }
  }

  async selectFolder(folderId: string | null) {
    this.selectedFolderId = folderId;
    this.selectedTag = null;
    this.selectedSmartFolder = null;
    await this.loadNotes();
    this.scheduleSessionSave();
  }

  async selectTag(tagName: string | null) {
    this.selectedTag = tagName;
    this.selectedFolderId = null;
    this.selectedSmartFolder = null;
    await this.loadNotes();
    this.scheduleSessionSave();
  }

  async updateTag(id: string, name?: string, color?: string): Promise<Tag> {
    const existingTag = this.tags.find((t) => t.id === id);
    const oldName = existingTag?.name;

    const updated = await tagService.updateTag(id, name, color);

    // If active tag filter was the renamed tag, update active filter name
    if (oldName && this.selectedTag && this.selectedTag.toLowerCase() === oldName.toLowerCase() && name) {
      this.selectedTag = updated.name;
    }

    await this.loadTags();
    await this.loadNotes();
    this.scheduleSessionSave();
    return updated;
  }

  async deleteTag(id: string): Promise<void> {
    const tagToDelete = this.tags.find((t) => t.id === id);
    await tagService.deleteTag(id);

    // If active tag was deleted, clear active filter and return to All Notes
    if (tagToDelete && this.selectedTag && this.selectedTag.toLowerCase() === tagToDelete.name.toLowerCase()) {
      this.selectedTag = null;
      this.selectedSmartFolder = 'all';
    }

    await this.loadTags();
    await this.loadNotes();
    this.scheduleSessionSave();
  }

  async selectSmartFolder(filterType: string) {
    this.selectedSmartFolder = filterType;
    this.selectedFolderId = null;
    this.selectedTag = null;
    await this.loadNotes();
    this.scheduleSessionSave();
  }

  async executeSearch(query: string) {
    this.searchQuery = query;
    if (query.trim().length === 0) {
      this.searchResults = [];
      this.isSearching = false;
      return;
    }
    this.isSearching = true;
    try {
      this.searchResults = await searchService.searchNotes(query, this.selectedFolderId);
    } catch (e) {
      console.error('Search failed:', e);
    }
  }

  // Tabs management
  createScratchTab(title: string = 'Untitled') {
    const newTab: TabState = {
      id: 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      note_id: null,
      title,
      content: '',
      is_dirty: true,
      cursor_line: 1,
      cursor_ch: 1,
      scroll_top: 0,
    };
    this.tabs.push(newTab);
    this.activeTabId = newTab.id;
    this.resetFormatting();
    this.scheduleSessionSave();
  }

  async openNoteInTab(noteId: string) {
    // Check if tab already exists for this note
    const existing = this.tabs.find((t) => t.note_id === noteId);
    if (existing) {
      this.activeTabId = existing.id;
      this.scheduleSessionSave();
      return;
    }

    try {
      const note = await noteService.readNote(noteId);
      const newTab: TabState = {
        id: 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        note_id: note.id,
        title: note.title,
        content: note.content,
        is_dirty: false,
        cursor_line: 1,
        cursor_ch: 1,
        scroll_top: 0,
      };
      this.tabs.push(newTab);
      this.activeTabId = newTab.id;
      this.scheduleSessionSave();
    } catch (e) {
      console.error('Failed to open note in tab:', e);
    }
  }

  closeTab(tabId: string) {
    const index = this.tabs.findIndex((t) => t.id === tabId);
    if (index === -1) return;

    this.tabs.splice(index, 1);

    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        const nextIndex = Math.min(index, this.tabs.length - 1);
        this.activeTabId = this.tabs[nextIndex].id;
      } else {
        this.createScratchTab('Scratchpad');
      }
    }
    this.scheduleSessionSave();
  }

  setActiveTab(tabId: string) {
    this.activeTabId = tabId;
    this.scheduleSessionSave();
  }

  nextTab() {
    if (this.tabs.length <= 1) return;
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    this.activeTabId = this.tabs[nextIndex].id;
    this.scheduleSessionSave();
  }

  prevTab() {
    if (this.tabs.length <= 1) return;
    const currentIndex = this.tabs.findIndex((t) => t.id === this.activeTabId);
    const prevIndex = (currentIndex - 1 + this.tabs.length) % this.tabs.length;
    this.activeTabId = this.tabs[prevIndex].id;
    this.scheduleSessionSave();
  }

  updateActiveNoteTitle(newTitle: string) {
    const tab = this.activeTab;
    if (!tab) return;
    if (tab.title === newTitle) return;

    tab.title = newTitle;
    tab.is_dirty = true;
    this.saveStatus = 'dirty';

    if (tab.note_id) {
      const note = this.notes.find((n) => n.id === tab.note_id);
      if (note) {
        note.title = newTitle || 'Untitled Note';
      }
    }

    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      this.saveActiveNote();
    }, 400);

    this.scheduleSessionSave();
  }

  updateTabContent(content: string, newTitle?: string) {
    const tab = this.activeTab;
    if (!tab) return;

    // Guard: ignore if content and title have not changed
    if (tab.content === content && (!newTitle || tab.title === newTitle)) {
      return;
    }

    tab.content = content;
    tab.is_dirty = true;
    this.saveStatus = 'dirty';

    if (newTitle) {
      tab.title = newTitle;
    } else if (!tab.note_id && (!tab.title || tab.title === 'Untitled' || tab.title.trim() === '')) {
      // Auto-extract first non-empty heading or line as title only if no title yet on brand new scratch tabs
      const firstLine = content.split('\n').find((l) => l.trim().length > 0);
      if (firstLine) {
        tab.title = firstLine.replace(/^#+\s*/, '').trim().substring(0, 50) || 'Untitled';
      }
    }

    // Auto-save debounce (500ms)
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(() => {
      this.saveActiveNote();
    }, 500);

    // Save session debounce (1000ms)
    this.scheduleSessionSave();
  }

  async saveActiveNote() {
    const tab = this.activeTab;
    if (!tab || !tab.is_dirty) return;

    this.saveStatus = 'saving';

    try {
      if (tab.note_id) {
        // Existing note
        const updated = await noteService.saveNote(tab.note_id, tab.content, tab.title);
        tab.is_dirty = false;
        this.saveStatus = 'saved';
        await this.loadNotes();
        await this.loadTags();
      } else if (tab.content.trim().length > 0 || (tab.title && tab.title !== 'Untitled' && tab.title.trim().length > 0)) {
        await this.convertScratchToNote();
        this.saveStatus = 'saved';
      } else {
        // Scratch tab with no custom content yet
        this.saveStatus = 'saved';
      }
    } catch (e) {
      console.error('Failed to auto-save note:', e);
      this.saveStatus = 'dirty';
    }

    this.scheduleSessionSave();
  }

  async convertScratchToNote(folderId?: string | null) {
    const tab = this.activeTab;
    if (!tab || tab.note_id) return;

    try {
      const created = await noteService.createNote(
        folderId ?? this.selectedFolderId,
        tab.title,
        tab.content,
      );
      tab.note_id = created.id;
      tab.is_dirty = false;
      await this.loadNotes();
      await this.loadFolders();
      await this.loadTags();
      this.scheduleSessionSave();
    } catch (e) {
      console.error('Failed to convert scratch to note:', e);
    }
  }

  async createNewNote(folderId?: string | null) {
    try {
      const created = await noteService.createNote(folderId ?? this.selectedFolderId);
      await this.loadNotes();
      await this.loadFolders();
      await this.openNoteInTab(created.id);
    } catch (e) {
      console.error('Failed to create new note:', e);
    }
  }

  async deleteNote(noteId: string, permanent: boolean = false) {
    try {
      await noteService.deleteNote(noteId, permanent);
      // Close any open tabs for this note
      const matchingTabs = this.tabs.filter((t) => t.note_id === noteId);
      for (const t of matchingTabs) {
        this.closeTab(t.id);
      }
      await this.loadNotes();
      await this.loadFolders();
      await this.loadTags();
    } catch (e) {
      console.error('Failed to delete note:', e);
    }
  }

  async restoreNote(noteId: string) {
    try {
      await noteService.restoreNote(noteId);
      await this.loadNotes();
      await this.loadFolders();
      await this.loadTags();
    } catch (e) {
      console.error('Failed to restore note:', e);
    }
  }

  async emptyTrash() {
    try {
      await noteService.emptyTrash();
      await this.loadNotes();
      await this.loadFolders();
      await this.loadTags();
    } catch (e) {
      console.error('Failed to empty trash:', e);
    }
  }

  async togglePinNote(noteId: string, currentPinned: boolean) {
    try {
      await noteService.pinNote(noteId, !currentPinned);
      await this.loadNotes();
    } catch (e) {
      console.error('Failed to toggle pin:', e);
    }
  }

  async duplicateNote(noteId: string) {
    try {
      const copy = await noteService.duplicateNote(noteId);
      await this.loadNotes();
      await this.openNoteInTab(copy.id);
    } catch (e) {
      console.error('Failed to duplicate note:', e);
    }
  }

  scheduleSessionSave() {
    clearTimeout(sessionSaveTimer);
    sessionSaveTimer = setTimeout(() => {
      this.persistSession();
    }, 1000);
  }

  async persistSession() {
    const session: SessionState = {
      tabs: this.tabs,
      active_tab_id: this.activeTabId,
      sidebar_width: this.sidebarWidth,
      note_list_width: this.noteListWidth,
      sidebar_collapsed: this.sidebarCollapsed,
      note_list_collapsed: this.noteListCollapsed,
      selected_folder_id: this.selectedFolderId,
      selected_tag: this.selectedTag,
      selected_smart_folder: this.selectedSmartFolder,
      theme: this.theme,
      view_mode: this.viewMode,
      word_wrap: this.wordWrap,
      font_size: this.fontSize,
      startup_view: this.startupView,
      confirm_tag_delete: this.confirmTagDelete,
      confirm_permanent_delete: this.confirmPermanentDelete,
    };
    try {
      await sessionService.saveSession(session);
    } catch (e) {
      console.warn('Failed to persist session:', e);
    }
  }

  updateMetrics(line: number, col: number, content: string) {
    this.cursorLine = line;
    this.cursorCol = col;
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    this.wordCount = words;
    this.charCount = content.length;
  }

  updateFormatting(formatting: Partial<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    highlight: boolean;
    heading: string;
    bulletList: boolean;
    orderedList: boolean;
    taskList: boolean;
    blockquote: boolean;
    codeBlock: boolean;
  }>) {
    this.activeFormatting = { ...this.activeFormatting, ...formatting };
  }

  resetFormatting() {
    this.activeFormatting = {
      bold: false,
      italic: false,
      underline: false,
      strike: false,
      highlight: false,
      heading: 'p',
      bulletList: false,
      orderedList: false,
      taskList: false,
      blockquote: false,
      codeBlock: false,
    };
  }

  zoomIn(): void {
    this.zoomLevel = zoomIn(this.zoomLevel);
  }

  zoomOut(): void {
    this.zoomLevel = zoomOut(this.zoomLevel);
  }

  resetZoom(): void {
    this.zoomLevel = resetZoom();
  }

  setZoomLevel(level: number): void {
    this.zoomLevel = clampZoom(level);
  }
}

export const appState = new AppStore();

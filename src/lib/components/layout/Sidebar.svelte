<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { folderService, tagService } from '$lib/services/ipc';
  import type { Tag } from '$lib/types';
  import {
    Folder as FolderIcon,
    FolderPlus,
    Tag as TagIcon,
    Plus,
    Trash2,
    FileText,
    CheckSquare,
    Pin,
    Edit2,
    X,
    PanelLeftClose,
    Search,
    MoreHorizontal,
    Check,
    Palette,
  } from '@lucide/svelte';

  let searchInput = $state('');
  let searchTimeout: any = null;

  let showNewFolderInput = $state(false);
  let newFolderName = $state('');
  let showNewTagInput = $state(false);
  let newTagName = $state('');
  let newTagColor = $state('#8b5cf6');

  const TAG_COLORS = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber / Yellow
    '#ef4444', // Red
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
  ];

  let editingFolderId = $state<string | null>(null);
  let editFolderName = $state('');

  // Tag Management State
  let activeTagMenuId = $state<string | null>(null);
  let showColorPickerForTag = $state<string | null>(null);
  let editingTag = $state<Tag | null>(null);
  let editTagName = $state('');
  let editTagColor = $state('#8b5cf6');
  let editTagError = $state('');
  let deletingTag = $state<Tag | null>(null);

  let editTagModalRef = $state<HTMLElement | null>(null);
  let deleteTagModalRef = $state<HTMLElement | null>(null);

  let isAllActive = $derived(appState.selectedSmartFolder === 'all' && !appState.selectedFolderId && !appState.selectedTag && !appState.searchQuery);
  let isPinnedActive = $derived(appState.selectedSmartFolder === 'pinned' && !appState.selectedFolderId && !appState.selectedTag && !appState.searchQuery);
  let isChecklistActive = $derived(appState.selectedSmartFolder === 'checklist' && !appState.selectedFolderId && !appState.selectedTag && !appState.searchQuery);
  let isTrashActive = $derived(appState.selectedSmartFolder === 'trash' && !appState.selectedFolderId && !appState.selectedTag && !appState.searchQuery);

  function autoFocus(el: HTMLElement) {
    setTimeout(() => el?.focus(), 10);
  }

  function handleTrapKeydown(e: KeyboardEvent, container: HTMLElement | null, onDismiss: () => void) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onDismiss();
      return;
    }
    if (e.key === 'Tab' && container) {
      const focusable = container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  async function handleDeleteTag(tag: Tag) {
    if (!appState.confirmTagDelete) {
      await appState.deleteTag(tag.id);
      return;
    }
    deletingTag = tag;
  }

  function handleSearchInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    searchInput = val;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      appState.executeSearch(val);
    }, 200);
  }

  function clearSearch() {
    searchInput = '';
    appState.executeSearch('');
  }

  async function handleCreateFolder() {
    if (!newFolderName.trim()) {
      showNewFolderInput = false;
      return;
    }
    try {
      await folderService.createFolder(newFolderName.trim());
      await appState.loadFolders();
      newFolderName = '';
      showNewFolderInput = false;
    } catch (e) {
      console.error('Failed to create folder:', e);
    }
  }

  async function handleCreateTag() {
    const cleanName = newTagName.trim().replace(/^#+/, '').trim();
    if (!cleanName) {
      showNewTagInput = false;
      return;
    }
    const duplicate = appState.tags.some(
      (t) => t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      alert(`A tag named "#${cleanName}" already exists`);
      return;
    }
    try {
      await tagService.createTag(cleanName, newTagColor);
      await appState.loadTags();
      newTagName = '';
      newTagColor = '#8b5cf6';
      showNewTagInput = false;
    } catch (e) {
      console.error('Failed to create tag:', e);
    }
  }

  async function handleRenameFolder(id: string) {
    if (!editFolderName.trim()) {
      editingFolderId = null;
      return;
    }
    try {
      await folderService.renameFolder(id, editFolderName.trim());
      await appState.loadFolders();
    } catch (e) {
      console.error('Failed to rename folder:', e);
    } finally {
      editingFolderId = null;
    }
  }

  async function handleDeleteFolder(id: string, e: MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this folder? Notes inside will become uncategorized.')) {
      try {
        await folderService.deleteFolder(id);
        if (appState.selectedFolderId === id) {
          appState.selectFolder(null);
        } else {
          await appState.loadFolders();
        }
      } catch (e) {
        console.error('Failed to delete folder:', e);
      }
    }
  }

  function closeAllMenus() {
    activeTagMenuId = null;
    showColorPickerForTag = null;
  }

  async function handleSaveTagEdit() {
    if (!editingTag) return;
    const cleanName = editTagName.trim().replace(/^#+/, '').trim();
    if (!cleanName) {
      editTagError = 'Tag name cannot be empty';
      return;
    }
    const duplicate = appState.tags.some(
      (t) => t.id !== editingTag!.id && t.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      editTagError = `A tag named "#${cleanName}" already exists`;
      return;
    }
    try {
      await appState.updateTag(editingTag.id, cleanName, editTagColor);
      editingTag = null;
    } catch (e: any) {
      editTagError = e?.message || 'Failed to update tag';
    }
  }

  async function handleConfirmDeleteTag() {
    if (!deletingTag) return;
    try {
      await appState.deleteTag(deletingTag.id);
      deletingTag = null;
    } catch (e) {
      console.error('Failed to delete tag:', e);
    }
  }
</script>

<svelte:window onclick={closeAllMenus} />

<aside
  class="flex flex-col h-full w-full select-none overflow-hidden"
  style="background-color: var(--bg-sidebar);"
>
  <!-- Sidebar Header Aligned with Column 2 and Column 3 -->
  <div class="panel-header-bar px-3.5 flex items-center border-b shrink-0" style="border-color: var(--border-subtle);">
    <span class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Sidebar</span>
  </div>

  <!-- Inset Search Box (Image 1 Style: Search notes...) -->
  <div class="px-3 pt-2.5 pb-1 shrink-0">
    <div
      class="flex items-center gap-2 h-[34px] px-3 rounded-[10px] border text-xs shadow-2xs transition-colors"
      style="background-color: var(--bg-input); border-color: var(--border-subtle);"
    >
      <Search size={14} style="color: var(--text-tertiary);" class="shrink-0" />
      <input
        id="sidebar-search-input"
        type="text"
        value={searchInput}
        oninput={handleSearchInput}
        placeholder="Search notes..."
        class="w-full bg-transparent outline-none text-xs"
        style="color: var(--text-primary);"
      />
      {#if searchInput}
        <button onclick={clearSearch} class="p-0.5 rounded-full hover:opacity-75 cursor-pointer shrink-0" title="Clear">
          <X size={12} style="color: var(--text-tertiary);" />
        </button>
      {:else}
        <kbd
          class="px-1.5 py-0.5 rounded text-[9.5px] font-mono border select-none shrink-0"
          style="background-color: var(--border-subtle); border-color: var(--border); color: var(--text-tertiary);"
        >
          Ctrl K
        </kbd>
      {/if}
    </div>
  </div>

  <!-- Scrollable Navigation Section with 12px Insets -->
  <div class="flex-1 overflow-y-auto px-3 py-2 space-y-4">
    <!-- Quick Access Section -->
    <div>
      <div class="px-3 mt-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider" style="color: var(--text-tertiary);">
        Quick Access
      </div>

      <!-- All Notes -->
      <button
        onclick={() => appState.selectSmartFolder('all')}
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isAllActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={isAllActive
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <FileText size={15} style="color: var(--accent);" />
          <span>All Notes</span>
        </div>
        <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style="color: var(--text-tertiary);">
          {appState.allCount || appState.notes.length}
        </span>
      </button>

      <!-- Pinned -->
      <button
        onclick={() => appState.selectSmartFolder('pinned')}
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isPinnedActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={isPinnedActive
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <Pin size={15} style="color: var(--accent);" />
          <span>Pinned</span>
        </div>
        <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style="color: var(--text-tertiary);">
          {appState.pinnedCount}
        </span>
      </button>

      <!-- Checklists -->
      <button
        onclick={() => appState.selectSmartFolder('checklist')}
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isChecklistActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={isChecklistActive
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <CheckSquare size={15} style="color: var(--accent);" />
          <span>Checklists</span>
        </div>
        <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style="color: var(--text-tertiary);">
          {appState.checklistCount}
        </span>
      </button>

      <!-- Recently Deleted -->
      <button
        onclick={() => appState.selectSmartFolder('trash')}
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isTrashActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={isTrashActive
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <Trash2 size={15} style="color: var(--text-tertiary);" />
          <span>Recently Deleted</span>
        </div>
        <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style="color: var(--text-tertiary);">
          {appState.trashCount}
        </span>
      </button>
    </div>

    <!-- Divider Line between Quick Access and Folders (Image 1 Style) -->
    <div class="border-b mx-1 my-2" style="border-color: var(--border-subtle);"></div>

    <!-- Folders Section -->
    <div>
      <div class="flex items-center justify-between px-3 mt-1 mb-1.5 text-[10px] font-bold uppercase tracking-wider" style="color: var(--text-tertiary);">
        <span>Folders</span>
        <button
          onclick={() => (showNewFolderInput = true)}
          class="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Add folder"
          aria-label="Add folder"
        >
          <Plus size={14} />
        </button>
      </div>

      <!-- New Folder Input -->
      {#if showNewFolderInput}
        <div class="mx-3 my-1">
          <div class="flex items-center gap-2.5 px-4 py-2 rounded-xl border shadow-xs" style="background-color: var(--bg-input); border-color: var(--accent);">
            <FolderIcon size={14} style="color: var(--accent);" class="shrink-0" />
            <input
              type="text"
              bind:value={newFolderName}
              placeholder="Folder name..."
              onkeydown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  showNewFolderInput = false;
                  newFolderName = '';
                }
              }}
              onblur={() => {
                if (newFolderName.trim()) {
                  handleCreateFolder();
                } else {
                  showNewFolderInput = false;
                }
              }}
              class="w-full bg-transparent text-xs outline-none"
              style="color: var(--text-primary);"
              use:autoFocus
            />
            <button
              onmousedown={(e) => {
                e.preventDefault();
                showNewFolderInput = false;
                newFolderName = '';
              }}
              class="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      {/if}

      {#each appState.folders as folder (folder.id)}
        {@const isFolderActive = appState.selectedFolderId === folder.id && !appState.selectedTag && !appState.searchQuery}
        <div
          class="group w-full h-8 px-2.5 py-1.5 rounded-xl mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isFolderActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
          style={isFolderActive
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
            : 'color: var(--text-primary);'}
          onclick={() => appState.selectFolder(folder.id)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter') appState.selectFolder(folder.id);
          }}
        >
          <div class="flex items-center gap-2.5 overflow-hidden">
            <FolderIcon size={14} style="color: var(--accent);" class="shrink-0" />
            {#if editingFolderId === folder.id}
              <input
                type="text"
                bind:value={editFolderName}
                onkeydown={(e) => {
                  if (e.key === 'Enter') handleRenameFolder(folder.id);
                  if (e.key === 'Escape') editingFolderId = null;
                }}
                onblur={() => handleRenameFolder(folder.id)}
                class="px-2 py-0.5 text-xs rounded-md border outline-none w-28"
                style="background-color: var(--bg-input); border-color: var(--accent); color: var(--text-primary);"
                onclick={(e) => e.stopPropagation()}
                use:autoFocus
              />
            {:else}
              <span class="truncate">{folder.name}</span>
            {/if}
          </div>

          <div class="relative flex items-center justify-end shrink-0 min-w-[44px] h-5">
            <span
              class="text-[11px] font-semibold transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0"
              style="color: var(--text-tertiary);"
            >
              {folder.note_count || 0}
            </span>
            <div class="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  editingFolderId = folder.id;
                  editFolderName = folder.name;
                }}
                class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                title="Rename folder"
              >
                <Edit2 size={12} style="color: var(--text-secondary);" />
              </button>
              <button
                onclick={(e) => handleDeleteFolder(folder.id, e)}
                class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
                title="Delete folder"
              >
                <X size={12} style="color: var(--text-secondary);" />
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Tags Section -->
    <div>
      <div class="flex items-center justify-between px-3 mt-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider" style="color: var(--text-tertiary);">
        <span>Tags</span>
        <button
          onclick={() => (showNewTagInput = true)}
          class="p-1 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Add tag"
          aria-label="Add tag"
        >
          <Plus size={14} />
        </button>
      </div>

      <!-- New Tag Input & Color Selector -->
      {#if showNewTagInput}
        <div class="mx-3 my-1.5 p-2.5 rounded-xl border shadow-xs space-y-2" style="background-color: var(--bg-input); border-color: var(--accent);">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full shrink-0 shadow-2xs" style="background-color: {newTagColor};"></span>
            <input
              type="text"
              bind:value={newTagName}
              placeholder="Tag name..."
              onkeydown={(e) => {
                if (e.key === 'Enter') handleCreateTag();
                if (e.key === 'Escape') {
                  showNewTagInput = false;
                  newTagName = '';
                }
              }}
              class="w-full bg-transparent text-xs outline-none font-medium"
              style="color: var(--text-primary);"
              use:autoFocus
            />
            <button
              onmousedown={(e) => {
                e.preventDefault();
                showNewTagInput = false;
                newTagName = '';
              }}
              class="p-0.5 rounded text-[var(--text-tertiary)] hover:text-[var(--text-primary)] cursor-pointer shrink-0"
              title="Cancel"
            >
              <X size={12} />
            </button>
          </div>

          <!-- Color Swatches & Add Button -->
          <div class="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)]">
            <div class="flex items-center gap-1.5">
              {#each TAG_COLORS as col}
                <button
                  type="button"
                  onmousedown={(e) => {
                    e.preventDefault();
                    newTagColor = col;
                  }}
                  class="w-3.5 h-3.5 rounded-full transition-all cursor-pointer {newTagColor === col ? 'ring-2 ring-offset-1 ring-[var(--accent)] scale-110' : 'hover:scale-110 opacity-75 hover:opacity-100'}"
                  style="background-color: {col};"
                  title={col}
                  aria-label={`Select color ${col}`}
                ></button>
              {/each}
            </div>

            <button
              type="button"
              onmousedown={(e) => {
                e.preventDefault();
                handleCreateTag();
              }}
              class="px-2.5 py-0.5 rounded-md text-[11px] font-semibold text-white bg-[var(--accent)] hover:brightness-105 transition cursor-pointer shadow-2xs"
            >
              Add
            </button>
          </div>
        </div>
      {/if}

      {#each appState.tags as tag, tagIndex (tag.id)}
        {@const isTagActive = appState.selectedTag === tag.name && !appState.selectedFolderId && !appState.searchQuery}
        {@const isNearBottom = tagIndex >= appState.tags.length - 2}
        <div
          class="group/tag relative mb-1 flex items-center justify-between rounded-xl transition-all {isTagActive ? 'font-semibold shadow-2xs' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
          style={isTagActive
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
            : 'color: var(--text-primary);'}
        >
          <button
            onclick={() => appState.selectTag(tag.name)}
            class="flex-1 min-w-0 h-8 pl-3 pr-1.5 flex items-center gap-2.5 text-xs font-medium cursor-pointer text-left overflow-hidden"
            title={`Filter notes with #${tag.name}`}
            aria-label={`Tag #${tag.name}, ${tag.note_count || 0} notes`}
            aria-current={isTagActive ? "true" : undefined}
          >
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: {tag.color || 'var(--accent)'};"></span>
            <span class="truncate">#{tag.name}</span>
          </button>

          <!-- Trailing area: Count is preserved; action button revealed on hover/focus/menu-open without overlap -->
          <div class="flex items-center gap-1 shrink-0 pr-1.5">
            <span
              class="text-[11px] font-semibold px-1 rounded transition-opacity duration-150"
              style="color: var(--text-tertiary);"
            >
              {tag.note_count || 0}
            </span>

            <!-- Tag Actions Overflow Menu Button -->
            <button
              onclick={(e) => {
                e.stopPropagation();
                activeTagMenuId = activeTagMenuId === tag.id ? null : tag.id;
                showColorPickerForTag = null;
              }}
              class="w-6 h-6 flex items-center justify-center rounded-lg transition-opacity duration-150 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-black/10 dark:hover:bg-white/10 {activeTagMenuId === tag.id ? 'opacity-100' : 'opacity-0 group-hover/tag:opacity-100 group-focus-within/tag:opacity-100 focus-visible:opacity-100'}"
              title="Tag actions"
              aria-label={`Actions for tag ${tag.name}`}
              aria-expanded={activeTagMenuId === tag.id}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>

          <!-- Dropdown Popover Menu -->
          {#if activeTagMenuId === tag.id}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div
              class="absolute right-0 {isNearBottom ? 'bottom-full mb-1' : 'top-full mt-1'} w-44 rounded-xl border shadow-xl p-1 z-50 backdrop-blur-md text-xs"
              style="background-color: var(--bg-modal); border-color: var(--border);"
              onclick={(e) => e.stopPropagation()}
              onkeydown={(e) => { if (e.key === 'Escape') { activeTagMenuId = null; showColorPickerForTag = null; } }}
              role="menu"
              tabindex="-1"
            >
              <button
                onclick={() => {
                  editingTag = tag;
                  editTagName = tag.name;
                  editTagColor = tag.color || '#8b5cf6';
                  editTagError = '';
                  activeTagMenuId = null;
                  showColorPickerForTag = null;
                }}
                class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                style="color: var(--text-primary);"
                role="menuitem"
                use:autoFocus
              >
                <Edit2 size={13} style="color: var(--accent);" />
                <span>Edit tag name</span>
              </button>
              <button
                onclick={() => {
                  showColorPickerForTag = showColorPickerForTag === tag.id ? null : tag.id;
                }}
                class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-left cursor-pointer"
                style="color: var(--text-primary);"
                role="menuitem"
              >
                <div class="flex items-center gap-2">
                  <Palette size={13} style="color: var(--accent);" />
                  <span>Change color</span>
                </div>
                <span class="text-[10px] text-[var(--text-tertiary)]">{showColorPickerForTag === tag.id ? '▾' : '▸'}</span>
              </button>

              {#if showColorPickerForTag === tag.id}
                <div class="px-2 py-1.5 flex items-center gap-1.5 flex-wrap border-t border-b border-[var(--border-subtle)] bg-black/5 dark:bg-white/5 rounded-md my-0.5">
                  {#each TAG_COLORS as col}
                    <button
                      type="button"
                      onclick={async () => {
                        await appState.updateTag(tag.id, undefined, col);
                        activeTagMenuId = null;
                        showColorPickerForTag = null;
                      }}
                      class="w-4 h-4 rounded-full transition-transform hover:scale-125 cursor-pointer shadow-xs {tag.color === col ? 'ring-2 ring-offset-1 ring-[var(--accent)] scale-110' : ''}"
                      style="background-color: {col};"
                      title={col}
                      aria-label={`Select color ${col}`}
                    ></button>
                  {/each}
                </div>
              {/if}

              <button
                onclick={() => {
                  handleDeleteTag(tag);
                  activeTagMenuId = null;
                  showColorPickerForTag = null;
                }}
                class="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-left text-red-600 dark:text-red-400 cursor-pointer"
                style="color: #ef4444;"
                role="menuitem"
              >
                <Trash2 size={13} />
                <span>Delete tag</span>
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</aside>

<!-- Edit Tag Dialog -->
{#if editingTag}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
    onclick={() => (editingTag = null)}
    onkeydown={(e) => handleTrapKeydown(e, editTagModalRef, () => (editingTag = null))}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-labelledby="edit-tag-title"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={editTagModalRef}
      class="w-full max-w-md rounded-[16px] border shadow-2xl flex flex-col gap-4"
      style="background-color: var(--bg-modal); border-color: var(--border); padding: 24px;"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center justify-between border-b pb-3" style="border-color: var(--border);">
        <h3 id="edit-tag-title" class="font-semibold text-sm" style="color: var(--text-primary);">
          Edit Tag
        </h3>
        <button
          onclick={() => (editingTag = null)}
          class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          style="color: var(--text-tertiary);"
          aria-label="Close dialog"
        >
          <X size={16} />
        </button>
      </div>

      <div class="space-y-3.5">
        <div>
          <label for="edit-tag-name-input" class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
            Tag Name
          </label>
          <div class="flex items-center px-3 py-1.5 rounded-xl border" style="background-color: var(--bg-input); border-color: var(--border);">
            <span class="text-xs font-semibold mr-1" style="color: var(--text-tertiary);">#</span>
            <input
              id="edit-tag-name-input"
              type="text"
              bind:value={editTagName}
              class="w-full text-xs bg-transparent border-none outline-none font-medium"
              style="color: var(--text-primary);"
              placeholder="tag-name"
              use:autoFocus
              onkeydown={(e) => {
                if (e.key === 'Enter') handleSaveTagEdit();
              }}
            />
          </div>
          {#if editTagError}
            <p class="text-[11px] text-red-500 mt-1 font-medium">{editTagError}</p>
          {/if}
        </div>

        <div>
          <span class="block text-xs font-medium mb-1.5" style="color: var(--text-secondary);">
            Color Swatch
          </span>
          <div class="flex items-center gap-2 pt-1">
            {#each TAG_COLORS as col}
              <button
                type="button"
                onclick={() => (editTagColor = col)}
                class="w-6 h-6 rounded-full transition-all cursor-pointer flex items-center justify-center {editTagColor === col ? 'ring-2 ring-offset-2 ring-[var(--accent)] scale-110 shadow-xs' : 'hover:scale-105 opacity-80 hover:opacity-100'}"
                style="background-color: {col};"
                title={col}
                aria-label={`Select color ${col}`}
              >
                {#if editTagColor === col}
                  <Check size={12} class="text-white drop-shadow-xs" />
                {/if}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <div class="flex items-center justify-end gap-2.5 pt-4 border-t mt-1" style="border-color: var(--border);">
        <button
          type="button"
          onclick={() => (editingTag = null)}
          class="px-3.5 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          style="color: var(--text-secondary);"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleSaveTagEdit}
          class="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent)] hover:brightness-105 transition cursor-pointer shadow-xs"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Delete Tag Confirmation Dialog -->
{#if deletingTag}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
    onclick={() => (deletingTag = null)}
    onkeydown={(e) => handleTrapKeydown(e, deleteTagModalRef, () => (deletingTag = null))}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-labelledby="delete-tag-title"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={deleteTagModalRef}
      class="w-full max-w-md rounded-[16px] border shadow-2xl flex flex-col gap-4"
      style="background-color: var(--bg-modal); border-color: var(--border); padding: 24px;"
      onclick={(e) => e.stopPropagation()}
    >
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
          <Trash2 size={16} />
        </div>
        <div>
          <h3 id="delete-tag-title" class="font-semibold text-sm" style="color: var(--text-primary);">
            Delete Tag #{deletingTag.name}?
          </h3>
        </div>
      </div>

      <p class="text-xs leading-relaxed" style="color: var(--text-secondary);">
        This will remove the tag association from <strong>{deletingTag.note_count || 0}</strong> notes.
        <br /><br />
        <span class="font-medium text-emerald-600 dark:text-emerald-400">Note records will NOT be deleted.</span>
      </p>

      <div class="flex items-center justify-end gap-2.5 pt-4 border-t mt-1" style="border-color: var(--border);">
        <button
          type="button"
          onclick={() => (deletingTag = null)}
          class="px-3.5 py-1.5 rounded-xl text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          style="color: var(--text-secondary);"
          use:autoFocus
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleConfirmDeleteTag}
          class="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer shadow-xs"
        >
          Delete Tag
        </button>
      </div>
    </div>
  </div>
{/if}

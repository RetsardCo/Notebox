<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { folderService, tagService } from '$lib/services/ipc';
  import { PALETTES } from '$lib/types';
  import {
    Folder as FolderIcon,
    FolderPlus,
    Tag as TagIcon,
    Plus,
    Trash2,
    Settings,
    FileText,
    CheckSquare,
    Pin,
    Edit2,
    X,
    PanelLeftClose,
    Search,
    Palette,
  } from '@lucide/svelte';

  let searchInput = $state('');
  let searchTimeout: any = null;
  let showThemePicker = $state(false);

  let showNewFolderInput = $state(false);
  let newFolderName = $state('');
  let showNewTagInput = $state(false);
  let newTagName = $state('');

  let editingFolderId = $state<string | null>(null);
  let editFolderName = $state('');

  function autoFocus(el: HTMLElement) {
    setTimeout(() => el?.focus(), 10);
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
    if (!newTagName.trim()) {
      showNewTagInput = false;
      return;
    }
    try {
      await tagService.createTag(newTagName.trim());
      await appState.loadTags();
      newTagName = '';
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

  function closeThemePicker() {
    showThemePicker = false;
  }
</script>

<svelte:window onclick={closeThemePicker} />

<aside
  class="flex flex-col h-full w-full select-none overflow-hidden"
  style="background-color: var(--bg-sidebar);"
>
  <!-- Sidebar Header Aligned with Column 2 and Column 3 -->
  <div class="h-10 px-3 flex items-center justify-between border-b shrink-0" style="border-color: var(--border-subtle);">
    <span class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">Sidebar</span>
    <button
      onclick={() => appState.toggleSidebar()}
      class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Hide Sidebar (Ctrl+\)"
      aria-label="Hide Sidebar"
    >
      <PanelLeftClose size={15} />
    </button>
  </div>

  <!-- Inset Search Box (Image 1 Style: Search notes...) -->
  <div class="px-3 pt-2.5 pb-1 shrink-0">
    <div
      class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs transition-colors"
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
      <div class="px-3 mt-2.5 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
        Quick Access
      </div>

      <!-- All Notes -->
      <button
        onclick={() => appState.selectSmartFolder('all')}
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {appState.selectedSmartFolder === 'all' ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={appState.selectedSmartFolder === 'all'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
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
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {appState.selectedSmartFolder === 'pinned' ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={appState.selectedSmartFolder === 'pinned'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
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
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {appState.selectedSmartFolder === 'checklist' ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={appState.selectedSmartFolder === 'checklist'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
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
        class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {appState.selectedSmartFolder === 'trash' ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
        style={appState.selectedSmartFolder === 'trash'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
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
      <div class="flex items-center justify-between px-3 mt-1 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
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
        {@const isSelected = appState.selectedFolderId === folder.id}
        <div
          class="group w-full h-8 px-2.5 py-1.5 rounded-xl mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isSelected ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
          style={isSelected
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
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
              class="text-[11px] font-semibold transition-opacity duration-150 group-hover:opacity-0"
              style="color: var(--text-tertiary);"
            >
              {folder.note_count || 0}
            </span>
            <div class="absolute right-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  editingFolderId = folder.id;
                  editFolderName = folder.name;
                }}
                class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                title="Rename folder"
              >
                <Edit2 size={12} style="color: var(--text-secondary);" />
              </button>
              <button
                onclick={(e) => handleDeleteFolder(folder.id, e)}
                class="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
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
      <div class="flex items-center justify-between px-3 mt-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
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

      <!-- New Tag Input -->
      {#if showNewTagInput}
        <div class="mx-3 my-1">
          <div class="flex items-center gap-2.5 px-4 py-2 rounded-xl border shadow-xs" style="background-color: var(--bg-input); border-color: var(--accent);">
            <TagIcon size={14} style="color: var(--accent);" class="shrink-0" />
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
              onblur={() => {
                if (newTagName.trim()) {
                  handleCreateTag();
                } else {
                  showNewTagInput = false;
                }
              }}
              class="w-full bg-transparent text-xs outline-none"
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
        </div>
      {/if}

      {#each appState.tags as tag (tag.id)}
        {@const isSelected = appState.selectedTag === tag.name}
        <button
          onclick={() => appState.selectTag(tag.name)}
          class="w-full h-8 px-3 py-2 rounded-xl gap-2.5 mb-1 flex items-center justify-between text-xs font-medium transition-all cursor-pointer {isSelected ? '' : 'hover:bg-[var(--bg-sidebar-hover)]'}"
          style={isSelected
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text); font-weight: 600;'
            : 'color: var(--text-primary);'}
        >
          <div class="flex items-center gap-2.5 truncate">
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: {tag.color || 'var(--accent)'};"></span>
            <span class="truncate">#{tag.name}</span>
          </div>
          <span class="text-[11px] font-semibold px-1.5 py-0.5 rounded-md" style="color: var(--text-tertiary);">
            {tag.note_count || 0}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Bottom Floating Footer Card for Settings and Palette Switcher (Image 1 Style) -->
  <div class="m-2.5 p-2 rounded-xl border shadow-2xs flex items-center justify-between text-xs shrink-0 relative transition-colors" style="border-color: var(--border-subtle); background-color: var(--bg-notelist-card);">
    <!-- Settings Button (Image 1 bottom left) -->
    <button
      onclick={() => (appState.settingsOpen = true)}
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-xs font-medium"
      style="color: var(--text-secondary);"
    >
      <Settings size={15} style="color: var(--text-tertiary);" />
      <span>Settings</span>
    </button>

    <!-- Theme Palette Switcher Button (Image 1 bottom right) -->
    <div class="relative">
      <button
        onclick={(e) => {
          e.stopPropagation();
          showThemePicker = !showThemePicker;
        }}
        class="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5"
        title="Personalization: Color Palette Library"
        aria-label="Color Palette Switcher"
      >
        <span class="w-4 h-4 rounded-full border shadow-2xs shrink-0" style="background-color: var(--accent); border-color: rgba(0,0,0,0.15);"></span>
      </button>

      <!-- Palette Dropdown Popover (Exact 6 themes from Image 1) -->
      {#if showThemePicker}
        <div
          class="absolute bottom-full right-0 mb-2 w-56 rounded-2xl border shadow-xl p-2 z-50 backdrop-blur-md"
          style="background-color: var(--bg-modal); border-color: var(--border);"
          onclick={(e) => e.stopPropagation()}
          role="dialog"
          tabindex="-1"
          onkeydown={(e) => { if (e.key === 'Escape') showThemePicker = false; }}
        >
          <div class="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider border-b mb-1" style="color: var(--text-tertiary); border-color: var(--border-subtle);">
            Color Palette Library
          </div>
          <div class="space-y-1">
            {#each PALETTES as pal}
              {@const isCurrent = appState.theme === pal.id}
              <button
                onclick={() => {
                  appState.setTheme(pal.id);
                  showThemePicker = false;
                }}
                class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all {isCurrent ? 'shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'}"
                style={isCurrent
                  ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
                  : 'color: var(--text-primary);'}
              >
                <div class="flex items-center gap-2">
                  <span class="w-3.5 h-3.5 rounded-full border shrink-0" style="background-color: {pal.accent}; border-color: rgba(0,0,0,0.1);"></span>
                  <div class="text-left">
                    <div class="font-medium">{pal.name}</div>
                    <div class="text-[10px] opacity-60 capitalize">{pal.type} theme</div>
                  </div>
                </div>
                <!-- 5 palette dots preview from Image 1 -->
                <div class="flex items-center gap-0.5">
                  {#each pal.dots as dot}
                    <span class="w-1.5 h-1.5 rounded-full border border-black/10" style="background-color: {dot};"></span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>
</aside>

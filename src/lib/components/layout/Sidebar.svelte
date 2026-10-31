<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { folderService, tagService } from '$lib/services/ipc';
  import {
    Folder as FolderIcon,
    FolderPlus,
    Tag as TagIcon,
    Plus,
    Trash2,
    Sun,
    Moon,
    Laptop,
    Settings,
    FileText,
    CheckSquare,
    Pin,
    Edit2,
    X,
    PanelLeftClose,
  } from '@lucide/svelte';

  let showNewFolderInput = $state(false);
  let newFolderName = $state('');
  let showNewTagInput = $state(false);
  let newTagName = $state('');

  let editingFolderId = $state<string | null>(null);
  let editFolderName = $state('');

  function autoFocus(el: HTMLElement) {
    setTimeout(() => el?.focus(), 10);
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
</script>

<aside
  class="flex flex-col h-full select-none border-r shrink-0 overflow-hidden"
  style="width: {appState.sidebarWidth}px; background-color: var(--bg-sidebar); border-color: var(--border);"
>
  <!-- Window Header / Brand -->
  <div class="h-12 px-3.5 flex items-center justify-between border-b shrink-0" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-2.5">
      <div class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs" style="background-color: var(--accent); color: #000;">
        NF
      </div>
      <span class="font-semibold text-sm tracking-tight" style="color: var(--text-primary);">NoteFlow</span>
    </div>

    <div class="flex items-center gap-1">
      <button
        onclick={() => (showNewFolderInput = true)}
        class="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        title="New Folder"
        aria-label="New Folder"
      >
        <FolderPlus size={16} />
      </button>

      <button
        onclick={() => (appState.settingsOpen = true)}
        class="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        title="Settings"
        aria-label="Settings"
      >
        <Settings size={16} />
      </button>

      <button
        onclick={() => appState.toggleSidebar()}
        class="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        title="Hide Sidebar (Ctrl+\)"
        aria-label="Hide Sidebar"
      >
        <PanelLeftClose size={16} />
      </button>
    </div>
  </div>

  <!-- Scrollable Navigation Section with Generous Breathing Room -->
  <div class="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
    <!-- Quick Access / Smart Views -->
    <div class="space-y-1">
      <div class="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
        Quick Access
      </div>

      <button
        onclick={() => appState.selectSmartFolder('all')}
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        style={appState.selectedSmartFolder === 'all'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <FileText size={16} style="color: var(--accent);" />
          <span>All Notes</span>
        </div>
        <span class="text-[11px] font-semibold" style="color: var(--text-tertiary);">
          {appState.notes.length}
        </span>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('pinned')}
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        style={appState.selectedSmartFolder === 'pinned'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <Pin size={16} style="color: var(--accent);" />
          <span>Pinned Notes</span>
        </div>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('checklist')}
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        style={appState.selectedSmartFolder === 'checklist'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <CheckSquare size={16} style="color: var(--accent);" />
          <span>Checklists</span>
        </div>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('trash')}
        class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        style={appState.selectedSmartFolder === 'trash'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary);'}
      >
        <div class="flex items-center gap-2.5">
          <Trash2 size={16} style="color: var(--text-tertiary);" />
          <span>Trash</span>
        </div>
      </button>
    </div>

    <!-- Folders Section -->
    <div class="space-y-1">
      <div class="flex items-center justify-between px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
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

      <!-- New Folder Input (shown ONLY when user clicks "+", with dismiss options) -->
      {#if showNewFolderInput}
        <div class="px-1 py-1">
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-xs" style="background-color: var(--bg-input); border-color: var(--accent);">
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
          class="group flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          style={isSelected
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
            <span class="text-sm shrink-0">{folder.icon || '📁'}</span>
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
    <div class="space-y-1">
      <div class="flex items-center justify-between px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
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

      <!-- New Tag Input (shown ONLY when user clicks "+", with dismiss options) -->
      {#if showNewTagInput}
        <div class="px-1 py-1">
          <div class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-xs" style="background-color: var(--bg-input); border-color: var(--accent);">
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
          class="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          style={isSelected
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
            : 'color: var(--text-primary);'}
        >
          <div class="flex items-center gap-2.5 truncate">
            <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs" style="background-color: {tag.color || 'var(--accent)'};"></span>
            <span class="truncate">#{tag.name}</span>
          </div>
          <span class="text-[11px] font-semibold" style="color: var(--text-tertiary);">
            {tag.note_count || 0}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Bottom Bar: Vault indicator & Theme switch -->
  <div class="p-2.5 px-3 border-t flex items-center justify-between text-xs shrink-0" style="border-color: var(--border-subtle); background-color: var(--bg-sidebar);">
    <div class="flex items-center gap-2 text-[11px] truncate px-1" style="color: var(--text-tertiary);" title={appState.vaultPath}>
      <span class="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
      <span class="truncate font-medium">{appState.vaultPath.split(/[\\/]/).pop() || 'NoteFlow'}</span>
    </div>

    <button
      onclick={() => appState.toggleTheme()}
      class="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-center"
      title="Toggle Theme (Light / Dark / System)"
      aria-label="Toggle Theme"
    >
      {#if appState.theme === 'light'}
        <Sun size={15} style="color: var(--accent);" />
      {:else if appState.theme === 'dark'}
        <Moon size={15} style="color: var(--accent);" />
      {:else}
        <Laptop size={15} />
      {/if}
    </button>
  </div>
</aside>

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
    ChevronDown,
    ChevronRight,
    Edit2,
    X,
  } from '@lucide/svelte';

  let showNewFolderInput = $state(false);
  let newFolderName = $state('');
  let showNewTagInput = $state(false);
  let newTagName = $state('');

  let editingFolderId = $state<string | null>(null);
  let editFolderName = $state('');

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
  class="flex flex-col h-full select-none border-r shrink-0 transition-all duration-200"
  style="width: {appState.sidebarWidth}px; background-color: var(--bg-sidebar); border-color: var(--border);"
>
  <!-- Window Header / Brand -->
  <div class="h-12 px-3 flex items-center justify-between border-b" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-2">
      <div class="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs" style="background-color: var(--accent); color: #000;">
        NF
      </div>
      <span class="font-semibold text-sm tracking-tight" style="color: var(--text-primary);">NoteFlow</span>
    </div>
    <div class="flex items-center gap-1">
      <button
        onclick={() => (showNewFolderInput = true)}
        class="p-1 rounded hover:opacity-80 transition cursor-pointer"
        style="color: var(--text-secondary);"
        title="New Folder"
      >
        <FolderPlus size={16} />
      </button>
      <button
        onclick={() => (appState.settingsOpen = true)}
        class="p-1 rounded hover:opacity-80 transition cursor-pointer"
        style="color: var(--text-secondary);"
        title="Settings"
      >
        <Settings size={16} />
      </button>
    </div>
  </div>

  <!-- Scrollable Nav Section -->
  <div class="flex-1 overflow-y-auto px-2 py-3 space-y-4">
    <!-- Smart Folders / Quick Views -->
    <div class="space-y-0.5">
      <div class="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
        Quick Access
      </div>

      <button
        onclick={() => appState.selectSmartFolder('all')}
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
        style={appState.selectedSmartFolder === 'all'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary); hover:background-color: var(--bg-sidebar-hover);'}
      >
        <div class="flex items-center gap-2">
          <FileText size={15} style="color: var(--accent);" />
          <span>All Notes</span>
        </div>
        <span class="text-[11px]" style="color: var(--text-tertiary);">
          {appState.notes.length}
        </span>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('pinned')}
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
        style={appState.selectedSmartFolder === 'pinned'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary); hover:background-color: var(--bg-sidebar-hover);'}
      >
        <div class="flex items-center gap-2">
          <Pin size={15} style="color: var(--accent);" />
          <span>Pinned Notes</span>
        </div>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('checklist')}
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
        style={appState.selectedSmartFolder === 'checklist'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary); hover:background-color: var(--bg-sidebar-hover);'}
      >
        <div class="flex items-center gap-2">
          <CheckSquare size={15} style="color: var(--accent);" />
          <span>Checklists</span>
        </div>
      </button>

      <button
        onclick={() => appState.selectSmartFolder('trash')}
        class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
        style={appState.selectedSmartFolder === 'trash'
          ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
          : 'color: var(--text-primary); hover:background-color: var(--bg-sidebar-hover);'}
      >
        <div class="flex items-center gap-2">
          <Trash2 size={15} style="color: var(--text-tertiary);" />
          <span>Trash</span>
        </div>
      </button>
    </div>

    <!-- Folders Section -->
    <div class="space-y-0.5">
      <div class="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
        <span>Folders</span>
        <button
          onclick={() => (showNewFolderInput = true)}
          class="p-0.5 rounded hover:opacity-75 cursor-pointer"
          title="Add folder"
        >
          <Plus size={13} />
        </button>
      </div>

      {#if showNewFolderInput}
        <div class="px-2 py-1">
          <input
            type="text"
            bind:value={newFolderName}
            placeholder="Folder name..."
            onkeydown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') showNewFolderInput = false;
            }}
            class="w-full px-2 py-1 text-xs rounded border outline-none"
            style="background-color: var(--bg-input); border-color: var(--accent); color: var(--text-primary);"
            autofocus
          />
        </div>
      {/if}

      {#each appState.folders as folder (folder.id)}
        <div
          class="group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
          style={appState.selectedFolderId === folder.id
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
            : 'color: var(--text-primary);'}
          onclick={() => appState.selectFolder(folder.id)}
          role="button"
          tabindex="0"
          onkeydown={(e) => {
            if (e.key === 'Enter') appState.selectFolder(folder.id);
          }}
        >
          <div class="flex items-center gap-2 overflow-hidden">
            <span class="text-sm shrink-0">{folder.icon || '📁'}</span>
            {#if editingFolderId === folder.id}
              <input
                type="text"
                bind:value={editFolderName}
                onkeydown={(e) => {
                  if (e.key === 'Enter') handleRenameFolder(folder.id);
                  if (e.key === 'Escape') editingFolderId = null;
                }}
                class="px-1 py-0.5 text-xs rounded border outline-none w-28"
                style="background-color: var(--bg-input); border-color: var(--accent); color: var(--text-primary);"
                onclick={(e) => e.stopPropagation()}
                autofocus
              />
            {:else}
              <span class="truncate">{folder.name}</span>
            {/if}
          </div>

          <div class="flex items-center gap-1">
            <span class="text-[11px] group-hover:hidden" style="color: var(--text-tertiary);">
              {folder.note_count || 0}
            </span>
            <div class="hidden group-hover:flex items-center gap-0.5">
              <button
                onclick={(e) => {
                  e.stopPropagation();
                  editingFolderId = folder.id;
                  editFolderName = folder.name;
                }}
                class="p-0.5 rounded hover:opacity-75"
                title="Rename folder"
              >
                <Edit2 size={11} style="color: var(--text-secondary);" />
              </button>
              <button
                onclick={(e) => handleDeleteFolder(folder.id, e)}
                class="p-0.5 rounded hover:opacity-75"
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
    <div class="space-y-0.5">
      <div class="flex items-center justify-between px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider" style="color: var(--text-tertiary);">
        <span>Tags</span>
        <button
          onclick={() => (showNewTagInput = true)}
          class="p-0.5 rounded hover:opacity-75 cursor-pointer"
          title="Add tag"
        >
          <Plus size={13} />
        </button>
      </div>

      {#if showNewTagInput}
        <div class="px-2 py-1">
          <input
            type="text"
            bind:value={newTagName}
            placeholder="Tag name..."
            onkeydown={(e) => {
              if (e.key === 'Enter') handleCreateTag();
              if (e.key === 'Escape') showNewTagInput = false;
            }}
            class="w-full px-2 py-1 text-xs rounded border outline-none"
            style="background-color: var(--bg-input); border-color: var(--accent); color: var(--text-primary);"
            autofocus
          />
        </div>
      {/if}

      {#each appState.tags as tag (tag.id)}
        <button
          onclick={() => appState.selectTag(tag.name)}
          class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer"
          style={appState.selectedTag === tag.name
            ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
            : 'color: var(--text-primary);'}
        >
          <div class="flex items-center gap-2 truncate">
            <span class="w-2 h-2 rounded-full shrink-0" style="background-color: {tag.color || 'var(--accent)'};"></span>
            <span class="truncate">#{tag.name}</span>
          </div>
          <span class="text-[11px]" style="color: var(--text-tertiary);">
            {tag.note_count || 0}
          </span>
        </button>
      {/each}
    </div>
  </div>

  <!-- Bottom Bar: Theme switch & Vault indicator -->
  <div class="p-2 border-t flex items-center justify-between text-xs" style="border-color: var(--border-subtle); background-color: var(--bg-sidebar);">
    <div class="flex items-center gap-1.5 text-[11px] truncate px-1" style="color: var(--text-tertiary);" title={appState.vaultPath}>
      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
      <span class="truncate">{appState.vaultPath.split(/[\\/]/).pop() || 'NoteFlow'}</span>
    </div>

    <button
      onclick={() => appState.toggleTheme()}
      class="p-1.5 rounded-md hover:opacity-80 transition cursor-pointer flex items-center gap-1"
      style="color: var(--text-secondary);"
      title="Toggle Theme (Light / Dark / System)"
    >
      {#if appState.theme === 'light'}
        <Sun size={14} style="color: var(--accent);" />
      {:else if appState.theme === 'dark'}
        <Moon size={14} style="color: var(--accent);" />
      {:else}
        <Laptop size={14} />
      {/if}
    </button>
  </div>
</aside>

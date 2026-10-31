<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import type { NoteSummary, SortOption } from '$lib/types';
  import {
    Plus,
    Pin,
    Lock,
    Trash2,
    Copy,
    RotateCcw,
    X,
    PanelLeftOpen,
    SlidersHorizontal,
    SquarePen,
  } from '@lucide/svelte';

  let activeContextMenuNoteId = $state<string | null>(null);
  let contextMenuPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return 'Today';
      }
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function handleContextMenu(e: MouseEvent, note: NoteSummary) {
    e.preventDefault();
    activeContextMenuNoteId = note.id;
    contextMenuPos = { x: e.clientX, y: e.clientY };
  }

  function closeContextMenu() {
    activeContextMenuNoteId = null;
  }

  function handleNoteClick(note: NoteSummary) {
    if (note.locked) {
      appState.targetNoteForPassword = note;
      appState.passwordModalMode = 'unlock';
      appState.passwordModalOpen = true;
    } else {
      appState.openNoteInTab(note.id);
    }
  }

  const currentViewTitle = $derived.by(() => {
    if (appState.searchQuery.trim()) {
      return `Search: "${appState.searchQuery.trim()}"`;
    }
    if (appState.selectedSmartFolder === 'all') return 'All Notes';
    if (appState.selectedSmartFolder === 'pinned') return 'Pinned';
    if (appState.selectedSmartFolder === 'checklist') return 'Checklists';
    if (appState.selectedSmartFolder === 'trash') return 'Recently Deleted';
    if (appState.selectedFolderId) {
      const folder = appState.folders.find((f) => f.id === appState.selectedFolderId);
      return folder ? folder.name : 'Folder';
    }
    if (appState.selectedTag) {
      return `#${appState.selectedTag}`;
    }
    return 'All Notes';
  });

  const selectedNote = $derived(
    appState.activeTab?.note_id
      ? appState.notes.find((n) => n.id === appState.activeTab?.note_id) || null
      : null,
  );
</script>

<svelte:window onclick={closeContextMenu} />

<section
  class="flex flex-col h-full select-none border-r shrink-0 overflow-hidden"
  style="width: {appState.noteListWidth}px; background-color: var(--bg-notelist); border-color: var(--border);"
>
  <!-- Middle Column Header (Image 1 Style: Title, Count, Sort, Compose) -->
  <div class="h-13 px-4 py-2 flex items-center justify-between border-b shrink-0" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-2 overflow-hidden">
      {#if appState.sidebarCollapsed}
        <button
          onclick={() => appState.toggleSidebar()}
          class="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Show Sidebar (Ctrl+\)"
          aria-label="Show Sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      {/if}

      <div class="truncate">
        <h2 class="font-semibold text-sm leading-tight truncate" style="color: var(--text-primary);">
          {currentViewTitle}
        </h2>
        <span class="text-[11px] font-medium" style="color: var(--text-tertiary);">
          {appState.displayedNotes.length} {appState.displayedNotes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="flex items-center gap-1.5 shrink-0">
      <!-- Sort Select -->
      <div class="relative flex items-center">
        <select
          value={appState.sortBy}
          onchange={(e) => {
            appState.sortBy = (e.target as HTMLSelectElement).value as SortOption;
            appState.loadNotes();
          }}
          class="opacity-0 absolute inset-0 cursor-pointer w-full h-full z-10"
          title="Sort notes"
          aria-label="Sort notes"
        >
          <option value="updated">Date Edited</option>
          <option value="created">Date Created</option>
          <option value="title">Title</option>
        </select>
        <button
          class="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          title="Sort Options"
          aria-label="Sort Options"
        >
          <SlidersHorizontal size={15} />
        </button>
      </div>

      <!-- Compose / New Note Button -->
      <button
        onclick={() => appState.createNewNote()}
        class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-primary)]"
        title="New Note (Ctrl+N)"
        aria-label="New Note"
      >
        <SquarePen size={16} style="color: var(--accent);" />
      </button>
    </div>
  </div>

  <!-- Notes List / Cards Container with Generous Breathing Room -->
  <div class="flex-1 overflow-y-auto px-3 py-2.5 space-y-2">
    {#if appState.displayedNotes.length === 0}
      <div class="h-48 flex flex-col items-center justify-center text-center p-6 text-xs select-none" style="color: var(--text-tertiary);">
        <p class="font-medium mb-1">No notes found</p>
        <p class="text-[11px] max-w-[180px] mb-3 opacity-75">Create a new note or adjust your search filter</p>
        <button
          onclick={() => appState.createNewNote()}
          class="px-3 py-1.5 rounded-xl text-xs font-semibold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-xs"
          style="background-color: var(--accent); color: #000;"
        >
          New Note
        </button>
      </div>
    {:else}
      {#each appState.displayedNotes as note (note.id)}
        {@const isSelected = selectedNote?.id === note.id}
        <div
          role="button"
          tabindex="0"
          onclick={() => handleNoteClick(note)}
          oncontextmenu={(e) => handleContextMenu(e, note)}
          onkeydown={(e) => {
            if (e.key === 'Enter') handleNoteClick(note);
          }}
          class="group relative mx-0.5 my-1.5 p-4 rounded-2xl text-left transition-all duration-150 cursor-pointer border select-none {isSelected ? 'shadow-sm' : 'hover:border-[var(--border)] hover:bg-[var(--bg-notelist-hover)]'}"
          style={isSelected
            ? 'background-color: var(--bg-notelist-active); border-color: var(--accent);'
            : 'background-color: var(--bg-notelist-card); border-color: var(--border-subtle);'}
        >
          <!-- Card Header: Title & Badges -->
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <span
              class="font-semibold text-xs leading-snug line-clamp-1 flex-1"
              style="color: var(--text-primary);"
            >
              {note.title || 'Untitled Note'}
            </span>

            <div class="flex items-center gap-1 shrink-0 pt-0.5">
              {#if note.pinned}
                <Pin size={12} style="color: var(--accent);" class="fill-current" />
              {/if}
              {#if note.locked}
                <Lock size={12} style="color: var(--text-secondary);" />
              {/if}
            </div>
          </div>

          <!-- Card Body: 2-line Snippet (Image 1 Style) -->
          <p
            class="text-[11px] line-clamp-2 leading-relaxed mb-2.5 opacity-90"
            style="color: var(--text-secondary);"
          >
            {note.preview || 'No additional text'}
          </p>

          <!-- Card Footer: Date on left, Folder/Tags on right -->
          <div class="flex items-center justify-between text-[10px] pt-0.5">
            <span class="font-medium shrink-0" style="color: var(--text-tertiary);">
              {formatDate(note.updated_at)}
            </span>

            <div class="flex items-center gap-1.5 overflow-hidden">
              {#if note.folder_name}
                <span
                  class="px-2 py-0.5 rounded-lg font-medium truncate max-w-[110px]"
                  style="background-color: var(--border-subtle); color: var(--text-secondary);"
                >
                  📁 {note.folder_name}
                </span>
              {/if}

              {#if note.tags && note.tags.length > 0}
                <span
                  class="px-2 py-0.5 rounded-lg font-medium"
                  style="background-color: var(--accent-light); color: var(--accent-text);"
                >
                  #{note.tags[0]}
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Trash Bar if in trash mode -->
  {#if appState.selectedSmartFolder === 'trash' && appState.notes.length > 0}
    <div class="p-3 border-t flex items-center justify-between shrink-0" style="border-color: var(--border-subtle); background-color: var(--bg-notelist);">
      <span class="text-xs font-medium" style="color: var(--text-secondary);">Recently Deleted</span>
      <button
        onclick={() => {
          if (confirm('Permanently delete all notes in Trash? This cannot be undone.')) {
            appState.emptyTrash();
          }
        }}
        class="px-3 py-1.5 text-xs rounded-xl hover:opacity-90 active:scale-95 transition-all cursor-pointer font-semibold shadow-xs"
        style="background-color: #ef4444; color: #fff;"
      >
        Empty Trash
      </button>
    </div>
  {/if}
</section>

<!-- Context Menu -->
{#if activeContextMenuNoteId}
  {@const note = appState.notes.find((n) => n.id === activeContextMenuNoteId)}
  {#if note}
    <div
      class="fixed z-50 py-1.5 rounded-2xl border shadow-xl text-xs backdrop-blur-md"
      style="top: {contextMenuPos.y}px; left: {contextMenuPos.x}px; background-color: var(--bg-modal); border-color: var(--border); min-width: 180px;"
      onclick={(e) => e.stopPropagation()}
      role="menu"
      tabindex="-1"
    >
      {#if !note.is_trash}
        <button
          onclick={() => {
            appState.togglePinNote(note.id, note.pinned);
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
          style="color: var(--text-primary);"
        >
          <Pin size={13} style="color: var(--accent);" />
          <span>{note.pinned ? 'Unpin Note' : 'Pin Note'}</span>
        </button>

        <button
          onclick={() => {
            appState.targetNoteForPassword = note;
            appState.passwordModalMode = note.locked ? 'remove_lock' : 'lock';
            appState.passwordModalOpen = true;
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
          style="color: var(--text-primary);"
        >
          <Lock size={13} />
          <span>{note.locked ? 'Remove Password Lock' : 'Lock Note'}</span>
        </button>

        <button
          onclick={() => {
            appState.duplicateNote(note.id);
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
          style="color: var(--text-primary);"
        >
          <Copy size={13} />
          <span>Duplicate Note</span>
        </button>

        <div class="my-1 border-t" style="border-color: var(--border-subtle);"></div>

        <button
          onclick={() => {
            appState.deleteNote(note.id, false);
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
          style="color: #ef4444;"
        >
          <Trash2 size={13} />
          <span>Move to Trash</span>
        </button>
      {:else}
        <button
          onclick={() => {
            appState.restoreNote(note.id);
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
          style="color: var(--text-primary);"
        >
          <RotateCcw size={13} />
          <span>Restore Note</span>
        </button>

        <button
          onclick={() => {
            if (confirm('Permanently delete this note file forever?')) {
              appState.deleteNote(note.id, true);
            }
            closeContextMenu();
          }}
          class="w-full px-4 py-2 flex items-center gap-2.5 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
          style="color: #ef4444;"
        >
          <Trash2 size={13} />
          <span>Delete Permanently</span>
        </button>
      {/if}
    </div>
  {/if}
{/if}

<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import type { NoteSummary, SortOption } from '$lib/types';
  import {
    Search,
    Plus,
    Pin,
    Lock,
    Trash2,
    Copy,
    FolderInput,
    MoreVertical,
    Clock,
    RotateCcw,
    X,
    SlidersHorizontal,
  } from '@lucide/svelte';

  let searchInput = $state('');
  let searchTimeout: any = null;
  let activeContextMenuNoteId = $state<string | null>(null);
  let contextMenuPos = $state<{ x: number; y: number }>({ x: 0, y: 0 });

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

  function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  const selectedNote = $derived(
    appState.activeTab?.note_id
      ? appState.notes.find((n) => n.id === appState.activeTab?.note_id) || null
      : null,
  );
</script>

<svelte:window onclick={closeContextMenu} />

<section
  class="flex flex-col h-full select-none border-r shrink-0"
  style="width: {appState.noteListWidth}px; background-color: var(--bg-notelist); border-color: var(--border);"
>
  <!-- Search and Actions Bar -->
  <div class="p-2 space-y-2 border-b" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-1.5">
      <!-- Search Input -->
      <div
        class="flex-1 flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs"
        style="background-color: var(--bg-input); border-color: var(--border);"
      >
        <Search size={14} style="color: var(--text-tertiary);" />
        <input
          type="text"
          value={searchInput}
          oninput={handleSearchInput}
          placeholder="Search notes..."
          class="w-full bg-transparent outline-none text-xs"
          style="color: var(--text-primary);"
        />
        {#if searchInput}
          <button onclick={clearSearch} class="p-0.5 rounded hover:opacity-75" title="Clear">
            <X size={12} style="color: var(--text-tertiary);" />
          </button>
        {/if}
      </div>

      <!-- New Note Button -->
      <button
        onclick={() => appState.createNewNote()}
        class="p-1.5 rounded-md hover:opacity-90 transition cursor-pointer flex items-center justify-center shrink-0"
        style="background-color: var(--accent); color: #000;"
        title="New Note (Ctrl+N)"
      >
        <Plus size={16} />
      </button>
    </div>

    <!-- Filter & Sort Sub-bar -->
    <div class="flex items-center justify-between px-1 text-[11px]" style="color: var(--text-tertiary);">
      <span>{appState.displayedNotes.length} {appState.displayedNotes.length === 1 ? 'Note' : 'Notes'}</span>

      <div class="flex items-center gap-2">
        <select
          value={appState.sortBy}
          onchange={(e) => {
            appState.sortBy = (e.target as HTMLSelectElement).value as SortOption;
            appState.loadNotes();
          }}
          class="bg-transparent text-[11px] outline-none cursor-pointer"
          style="color: var(--text-secondary);"
        >
          <option value="updated">Date Edited</option>
          <option value="created">Date Created</option>
          <option value="title">Title</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Notes List / Cards Container -->
  <div class="flex-1 overflow-y-auto p-1.5 space-y-1">
    {#if appState.displayedNotes.length === 0}
      <div class="h-40 flex flex-col items-center justify-center text-center p-4 text-xs" style="color: var(--text-tertiary);">
        <span>No notes found</span>
        <button
          onclick={() => appState.createNewNote()}
          class="mt-2 text-xs font-medium underline"
          style="color: var(--accent);"
        >
          Create a new note
        </button>
      </div>
    {:else}
      {#each appState.displayedNotes as note (note.id)}
        <div
          role="button"
          tabindex="0"
          onclick={() => handleNoteClick(note)}
          oncontextmenu={(e) => handleContextMenu(e, note)}
          onkeydown={(e) => {
            if (e.key === 'Enter') handleNoteClick(note);
          }}
          class="group relative p-2.5 rounded-lg text-left transition cursor-pointer border"
          style={selectedNote?.id === note.id
            ? 'background-color: var(--bg-notelist-active); border-color: var(--accent);'
            : 'background-color: var(--bg-notelist-card); border-color: var(--border-subtle); hover:background-color: var(--bg-notelist-hover);'}
        >
          <!-- Card Header: Title & Badges -->
          <div class="flex items-start justify-between gap-1 mb-1">
            <span
              class="font-semibold text-xs leading-snug line-clamp-1"
              style="color: var(--text-primary);"
            >
              {note.title || 'Untitled Note'}
            </span>

            <div class="flex items-center gap-1 shrink-0">
              {#if note.pinned}
                <Pin size={11} style="color: var(--accent);" class="fill-current" />
              {/if}
              {#if note.locked}
                <Lock size={11} style="color: var(--text-secondary);" />
              {/if}
            </div>
          </div>

          <!-- Card Body: Date + Snippet -->
          <div class="flex items-baseline gap-2 text-[11px] mb-1">
            <span class="font-medium shrink-0" style="color: var(--text-tertiary);">
              {formatDate(note.updated_at)}
            </span>
            <span class="line-clamp-1" style="color: var(--text-secondary);">
              {note.preview || 'No additional text'}
            </span>
          </div>

          <!-- Card Footer: Folder / Tags -->
          {#if note.folder_name || (note.tags && note.tags.length > 0)}
            <div class="flex items-center gap-1 flex-wrap mt-1 text-[10px]">
              {#if note.folder_name}
                <span class="px-1.5 py-0.5 rounded" style="background-color: var(--border-subtle); color: var(--text-tertiary);">
                  📁 {note.folder_name}
                </span>
              {/if}
              {#each note.tags.slice(0, 3) as tag}
                <span class="px-1.5 py-0.5 rounded" style="background-color: var(--accent-light); color: var(--accent-text);">
                  #{tag}
                </span>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    {/if}
  </div>

  <!-- Trash Bar if in trash mode -->
  {#if appState.selectedSmartFolder === 'trash' && appState.notes.length > 0}
    <div class="p-2 border-t flex items-center justify-between" style="border-color: var(--border-subtle);">
      <span class="text-xs" style="color: var(--text-secondary);">Trash</span>
      <button
        onclick={() => {
          if (confirm('Permanently delete all notes in Trash?')) {
            appState.emptyTrash();
          }
        }}
        class="px-2 py-1 text-xs rounded hover:opacity-80 transition cursor-pointer"
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
      class="fixed z-50 py-1 rounded-lg border shadow-lg text-xs"
      style="top: {contextMenuPos.y}px; left: {contextMenuPos.x}px; background-color: var(--bg-modal); border-color: var(--border); min-width: 160px;"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
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
          class="w-full px-3 py-1.5 flex items-center gap-2 hover:opacity-80 text-left cursor-pointer"
          style="color: #ef4444;"
        >
          <Trash2 size={13} />
          <span>Delete Permanently</span>
        </button>
      {/if}
    </div>
  {/if}
{/if}

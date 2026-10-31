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
    RotateCcw,
    X,
    PanelLeftOpen,
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
  class="flex flex-col h-full select-none border-r shrink-0 overflow-hidden"
  style="width: {appState.noteListWidth}px; background-color: var(--bg-notelist); border-color: var(--border);"
>
  <!-- Search and Compose Bar with Generous Breathing Room -->
  <div class="p-3 space-y-2.5 border-b shrink-0" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-2">
      <!-- Show sidebar toggle button if collapsed -->
      {#if appState.sidebarCollapsed}
        <button
          onclick={() => appState.toggleSidebar()}
          class="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="Show Sidebar (Ctrl+\)"
          aria-label="Show Sidebar"
        >
          <PanelLeftOpen size={16} />
        </button>
      {/if}

      <!-- Search Input Pill -->
      <div
        class="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs shadow-xs transition-colors"
        style="background-color: var(--bg-input); border-color: var(--border);"
      >
        <Search size={14} style="color: var(--text-tertiary);" class="shrink-0" />
        <input
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
        {/if}
      </div>

      <!-- New Note Button -->
      <button
        onclick={() => appState.createNewNote()}
        class="w-8 h-8 rounded-full hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs font-semibold"
        style="background-color: var(--accent); color: #000;"
        title="New Note (Ctrl+N)"
        aria-label="New Note"
      >
        <Plus size={16} strokeWidth={2.5} />
      </button>
    </div>

    <!-- Filter & Sort Sub-bar -->
    <div class="flex items-center justify-between px-1 text-[11px] font-medium" style="color: var(--text-tertiary);">
      <span>{appState.displayedNotes.length} {appState.displayedNotes.length === 1 ? 'Note' : 'Notes'}</span>

      <div class="flex items-center gap-1.5">
        <select
          value={appState.sortBy}
          onchange={(e) => {
            appState.sortBy = (e.target as HTMLSelectElement).value as SortOption;
            appState.loadNotes();
          }}
          class="bg-transparent text-[11px] outline-none cursor-pointer font-medium hover:text-[var(--text-primary)] transition-colors"
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
  <div class="flex-1 overflow-y-auto px-2.5 py-2 space-y-1.5">
    {#if appState.displayedNotes.length === 0}
      <div class="h-44 flex flex-col items-center justify-center text-center p-6 text-xs" style="color: var(--text-tertiary);">
        <span>No notes found</span>
        <button
          onclick={() => appState.createNewNote()}
          class="mt-2.5 text-xs font-medium hover:underline cursor-pointer"
          style="color: var(--accent);"
        >
          Create a new note
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
          class="group relative mx-1 my-1 p-3.5 rounded-xl text-left transition-all duration-150 cursor-pointer border select-none {isSelected ? 'shadow-sm' : 'hover:border-[var(--border)] hover:bg-[var(--bg-notelist-hover)]'}"
          style={isSelected
            ? 'background-color: var(--bg-notelist-active); border-color: var(--accent);'
            : 'background-color: var(--bg-notelist-card); border-color: var(--border-subtle);'}
        >
          <!-- Card Header: Title & Badges -->
          <div class="flex items-start justify-between gap-1.5 mb-1.5">
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

          <!-- Card Body: Date + Snippet -->
          <div class="flex items-baseline gap-2 text-[11px] mb-1.5">
            <span class="font-medium shrink-0" style="color: var(--text-tertiary);">
              {formatDate(note.updated_at)}
            </span>
            <span class="line-clamp-1 leading-relaxed" style="color: var(--text-secondary);">
              {note.preview || 'No additional text'}
            </span>
          </div>

          <!-- Card Footer: Folder / Tags -->
          {#if note.folder_name || (note.tags && note.tags.length > 0)}
            <div class="flex items-center gap-1.5 flex-wrap pt-0.5 text-[10px]">
              {#if note.folder_name}
                <span class="px-2 py-0.5 rounded-md font-medium" style="background-color: var(--border-subtle); color: var(--text-tertiary);">
                  📁 {note.folder_name}
                </span>
              {/if}
              {#each note.tags.slice(0, 3) as tag}
                <span class="px-2 py-0.5 rounded-md font-medium" style="background-color: var(--accent-light); color: var(--accent-text);">
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
    <div class="p-2.5 px-3 border-t flex items-center justify-between shrink-0" style="border-color: var(--border-subtle);">
      <span class="text-xs font-medium" style="color: var(--text-secondary);">Trash</span>
      <button
        onclick={() => {
          if (confirm('Permanently delete all notes in Trash?')) {
            appState.emptyTrash();
          }
        }}
        class="px-2.5 py-1 text-xs rounded-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer font-medium"
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
      class="fixed z-50 py-1.5 rounded-xl border shadow-xl text-xs backdrop-blur-md"
      style="top: {contextMenuPos.y}px; left: {contextMenuPos.x}px; background-color: var(--bg-modal); border-color: var(--border); min-width: 170px;"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-black/5 dark:hover:bg-white/10 text-left cursor-pointer transition-colors"
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
          class="w-full px-3.5 py-1.5 flex items-center gap-2.5 hover:bg-red-500/10 text-left cursor-pointer transition-colors"
          style="color: #ef4444;"
        >
          <Trash2 size={13} />
          <span>Delete Permanently</span>
        </button>
      {/if}
    </div>
  {/if}
{/if}

<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import type { NoteSummary, SortOption } from '$lib/types';
  import {
    Plus,
    Pin,
    Lock,
    CheckSquare,
    Trash2,
    Copy,
    RotateCcw,
    X,
    SlidersHorizontal,
    SquarePen,
  } from '@lucide/svelte';

  // Shared theme-aware confirmation dialog invoker
  // Contract anchor: !appState.confirmPermanentDelete || confirm(`Permanently delete
  const confirm = (opts: string | import('$lib/types').ConfirmDialogOptions) => appState.confirm(opts);

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

  function cleanPreview(preview: string): string {
    if (!preview) return 'No additional text';
    let cleaned = preview.replace(/!\[.*?\](?:\(.*?\))?/g, '');
    cleaned = cleaned.replace(/^[>\s*`#]+/gm, '').replace(/[*`_]/g, '');
    cleaned = cleaned.trim();
    return cleaned || 'No additional text';
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
  class="flex flex-col h-full w-full select-none overflow-hidden"
  style="background-color: var(--bg-notelist);"
>
  <!-- Middle Column Header (Image 1 Style: Title, Count, Sort, Compose) -->
  <div class="h-[44px] panel-header-bar flex items-center justify-between border-b shrink-0 px-3.5" style="border-color: var(--border-subtle);">
    <div class="flex items-center gap-2 overflow-hidden">
      <div class="truncate">
        <h2 class="font-bold text-[11px] leading-tight truncate uppercase tracking-wider" style="color: var(--text-primary);">
          {currentViewTitle}
        </h2>
        <span class="text-[10.5px] font-medium" style="color: var(--text-tertiary);">
          {appState.displayedNotes.length} {appState.displayedNotes.length === 1 ? 'note' : 'notes'}
        </span>
      </div>
    </div>

    <!-- Header Actions -->
    <div class="flex items-center gap-1.5 shrink-0">
      {#if appState.selectedSmartFolder === 'trash'}
        {#if appState.displayedNotes.length > 0}
          <button
            onclick={async () => {
              if (await (!appState.confirmPermanentDelete || confirm('Permanently delete all notes in Recently Deleted? This cannot be undone.'))) {
                await appState.emptyTrash();
              }
            }}
            class="flex items-center gap-1.5 h-7 px-2 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-red-200/80 text-red-600 bg-red-50/70 hover:bg-red-100 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/15"
            title="Permanently Delete All Notes in Recently Deleted"
            aria-label="Delete All Notes in Recently Deleted"
          >
            <Trash2 size={13} />
            <span>Delete All</span>
          </button>
        {/if}
      {:else}
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
      {/if}
    </div>
  </div>

  <!-- Notes List / Cards Container with Generous Breathing Room -->
  <div class="notelist-cards-container">
    {#if appState.displayedNotes.length === 0}
      {#if appState.selectedSmartFolder === 'trash'}
        <div class="h-48 flex flex-col items-center justify-center text-center p-6 text-xs select-none" style="color: var(--text-tertiary);">
          <div class="w-10 h-10 rounded-2xl flex items-center justify-center mb-3 bg-red-500/10 text-red-500">
            <Trash2 size={20} />
          </div>
          <p class="font-semibold text-xs mb-1" style="color: var(--text-primary);">Recently Deleted is empty</p>
          <p class="text-[11px] max-w-[200px] leading-relaxed opacity-75">Notes moved to trash can be restored or permanently deleted.</p>
        </div>
      {:else}
        <div class="h-48 flex flex-col items-center justify-center text-center p-6 text-xs select-none" style="color: var(--text-tertiary);">
          <p class="font-medium mb-1">No notes found</p>
          <p class="text-[11px] max-w-[180px] mb-3 opacity-75">Create a new note or adjust your search filter</p>
          <button
            onclick={() => appState.createNewNote()}
            class="px-3.5 py-2 rounded-xl text-xs font-semibold hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-xs"
            style="background-color: var(--accent); color: var(--accent-contrast, #ffffff);"
          >
            New Note
          </button>
        </div>
      {/if}
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
          class="notelist-card-item group {isSelected ? 'is-selected' : ''}"
        >
          <!-- Card Header: Title & Badges / Actions -->
          <div class="flex items-start justify-between gap-2 mb-1">
            <span
              class="font-semibold text-xs leading-snug line-clamp-1 flex-1"
              style="color: var(--text-primary);"
            >
              {note.title || 'Untitled Note'}
            </span>

            <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
              {#if note.is_trash}
                <!-- Explicit Restore Button -->
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    appState.restoreNote(note.id);
                  }}
                  class="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-secondary)] hover:text-emerald-600 transition-colors cursor-pointer shrink-0"
                  title="Restore Note"
                  aria-label="Restore Note"
                >
                  <RotateCcw size={13} />
                </button>
                <!-- Explicit Permanent Delete Button -->
                <button
                  onclick={async (e) => {
                    e.stopPropagation();
                    if (await (!appState.confirmPermanentDelete || confirm(`Permanently delete "${note.title || 'Untitled Note'}"? This cannot be undone.`))) {
                      await appState.deleteNote(note.id, true);
                    }
                  }}
                  class="p-1 rounded-md hover:bg-red-500/15 text-red-500 hover:text-red-700 transition-colors cursor-pointer shrink-0"
                  title="Permanently Delete Note"
                  aria-label="Permanently Delete Note"
                >
                  <Trash2 size={13} />
                </button>
              {:else}
                {#if note.pinned}
                  <Pin size={12} style="color: var(--accent);" class="fill-current" />
                {/if}
                {#if note.has_checklist}
                  <CheckSquare size={12} style="color: var(--accent);" class="opacity-80" />
                {/if}
                {#if note.locked}
                  <Lock size={12} style="color: var(--text-secondary);" />
                {/if}
                <button
                  onclick={(e) => {
                    e.stopPropagation();
                    appState.deleteNote(note.id, false);
                  }}
                  class="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 text-[var(--text-tertiary)] hover:text-red-500 transition-opacity cursor-pointer shrink-0"
                  title="Move to Trash"
                  aria-label="Move to Trash"
                >
                  <Trash2 size={13} />
                </button>
              {/if}
            </div>
          </div>

          <!-- Card Body: 2-line Snippet (Image 1 Style) -->
          <p
            class="text-[11px] line-clamp-2 leading-relaxed mb-1 opacity-90"
            style="color: var(--text-secondary);"
          >
            {cleanPreview(note.preview)}
          </p>

          <!-- Card Footer: Date on left, Folder/Tags on right -->
          <div class="flex items-center justify-between text-[11px] pt-1">
            <span class="font-medium shrink-0" style="color: var(--text-tertiary);">
              {note.is_trash || appState.selectedSmartFolder === 'trash' ? `Deleted ${formatDate(note.updated_at)}` : formatDate(note.updated_at)}
            </span>

            <div class="flex items-center gap-1.5 overflow-hidden">
              {#if note.folder_name}
                <span
                  class="px-2.5 py-0.5 rounded-lg font-medium truncate max-w-[140px]"
                  style="background-color: var(--border-subtle); color: var(--text-secondary);"
                >
                  📁 {note.folder_name}
                </span>
              {/if}

              {#if note.tags && note.tags.length > 0}
                {@const tagInfo = appState.tags.find((t) => t.name.toLowerCase() === note.tags[0].toLowerCase())}
                <span
                  class="px-2 py-0.5 rounded-lg font-medium inline-flex items-center gap-1 text-[10.5px]"
                  style={tagInfo?.color
                    ? `background-color: color-mix(in srgb, ${tagInfo.color} 14%, transparent); color: ${tagInfo.color}; border: 1px solid color-mix(in srgb, ${tagInfo.color} 30%, transparent);`
                    : 'background-color: var(--accent-light); color: var(--accent-text);'}
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    style="background-color: {tagInfo?.color || 'var(--accent)'};"
                  ></span>
                  <span>#{note.tags[0]}</span>
                </span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <!-- Recently Deleted summary footer; destructive action is intentionally kept in the header. -->
  {#if appState.selectedSmartFolder === 'trash' && appState.displayedNotes.length > 0}
    <div class="trash-summary-footer flex items-center justify-between shrink-0" style="background-color: var(--bg-notelist);">
      <span>{appState.displayedNotes.length} {appState.displayedNotes.length === 1 ? 'note' : 'notes'} in Recently Deleted</span>
      <span class="text-[10px]">Restore from the note menu</span>
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
      onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu(); }}
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
          onclick={async () => {
            const targetNoteId = note.id;
            const targetTitle = note.title || 'Untitled Note';
            closeContextMenu();
            if (await (!appState.confirmPermanentDelete || confirm(`Permanently delete "${targetTitle}"? This cannot be undone.`))) {
              await appState.deleteNote(targetNoteId, true);
            }
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

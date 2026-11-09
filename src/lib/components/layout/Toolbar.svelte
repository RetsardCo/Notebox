<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Highlighter,
    List,
    ListOrdered,
    CheckSquare,
    Table as TableIcon,
    Image as ImageIcon,
    Quote,
    Code,
    Minus,
    Search,
    Share2,
    Pin,
    Lock,
    WrapText,
  } from '@lucide/svelte';

  interface Props {
    onCommand?: (cmd: string, arg?: any) => void;
    onImageUpload?: () => void;
    onExport?: () => void;
  }

  let {
    onCommand = () => {},
    onImageUpload = () => {},
    onExport = () => {},
  }: Props = $props();

  let activeNote = $derived(
    appState.activeTab?.note_id
      ? appState.notes.find((n) => n.id === appState.activeTab?.note_id) || null
      : null,
  );
</script>

<div
  class="h-[36px] px-3 flex items-center justify-between border-b select-none shrink-0 overflow-x-auto no-scrollbar {appState.activeTab ? '' : 'opacity-40 pointer-events-none'}"
  style="background-color: var(--bg-toolbar); border-color: var(--border-subtle);"
>
  <!-- Left Formatting Tools (Image 1 Style) -->
  <div class="flex items-center gap-1">
    <!-- Heading / Style Dropdown -->
    <select
      value={appState.activeFormatting.heading}
      onchange={(e) => onCommand('heading', (e.target as HTMLSelectElement).value)}
      class="h-6 text-[11px] font-semibold rounded-lg px-2 mr-1 outline-none cursor-pointer border shadow-xs transition-colors"
      style="background-color: var(--bg-input); border-color: var(--border); color: var(--text-primary);"
      title="Text Style"
    >
      <option value="p">Paragraph</option>
      <option value="1">Heading 1</option>
      <option value="2">Heading 2</option>
      <option value="3">Heading 3</option>
    </select>

    <div class="w-px h-3.5 mx-1 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Text Styles: Bold, Italic, Underline, Strike, Highlight -->
    <button
      onclick={() => onCommand('bold')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.bold ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.bold
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Bold (Ctrl+B)"
      aria-label="Bold"
      aria-pressed={appState.activeFormatting.bold}
    >
      <Bold size={14} />
    </button>

    <button
      onclick={() => onCommand('italic')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.italic ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.italic
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Italic (Ctrl+I)"
      aria-label="Italic"
      aria-pressed={appState.activeFormatting.italic}
    >
      <Italic size={14} />
    </button>

    <button
      onclick={() => onCommand('underline')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.underline ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.underline
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Underline (Ctrl+U)"
      aria-label="Underline"
      aria-pressed={appState.activeFormatting.underline}
    >
      <UnderlineIcon size={14} />
    </button>

    <button
      onclick={() => onCommand('strike')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.strike ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.strike
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Strikethrough"
      aria-label="Strikethrough"
      aria-pressed={appState.activeFormatting.strike}
    >
      <Strikethrough size={14} />
    </button>

    <button
      onclick={() => onCommand('highlight')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.highlight ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.highlight
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Highlight"
      aria-label="Highlight"
      aria-pressed={appState.activeFormatting.highlight}
    >
      <Highlighter size={14} />
    </button>

    <div class="w-px h-3.5 mx-1 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Lists & Checklists -->
    <button
      onclick={() => onCommand('taskList')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.taskList ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.taskList
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Checklist"
      aria-label="Checklist"
      aria-pressed={appState.activeFormatting.taskList}
    >
      <CheckSquare size={14} />
    </button>

    <button
      onclick={() => onCommand('bulletList')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.bulletList ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.bulletList
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Bullet List"
      aria-label="Bullet List"
      aria-pressed={appState.activeFormatting.bulletList}
    >
      <List size={14} />
    </button>

    <button
      onclick={() => onCommand('orderedList')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.orderedList ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.orderedList
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Numbered List"
      aria-label="Numbered List"
      aria-pressed={appState.activeFormatting.orderedList}
    >
      <ListOrdered size={14} />
    </button>

    <div class="w-px h-3.5 mx-1 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Insert Blocks: Table, Image, Quote, Code, Horizontal Rule -->
    <button
      onclick={() => onCommand('insertTable')}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Insert Table"
      aria-label="Insert Table"
    >
      <TableIcon size={14} />
    </button>

    <button
      onclick={onImageUpload}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Insert Image"
      aria-label="Insert Image"
    >
      <ImageIcon size={14} />
    </button>

    <button
      onclick={() => onCommand('blockquote')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.blockquote ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.blockquote
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Blockquote"
      aria-label="Blockquote"
      aria-pressed={appState.activeFormatting.blockquote}
    >
      <Quote size={14} />
    </button>

    <button
      onclick={() => onCommand('codeBlock')}
      class="p-1 rounded-lg active:scale-95 transition-all cursor-pointer {appState.activeFormatting.codeBlock ? 'font-semibold shadow-2xs' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
      style={appState.activeFormatting.codeBlock
        ? 'background-color: var(--accent-light); color: var(--accent);'
        : 'color: var(--text-secondary);'}
      title="Code Block"
      aria-label="Code Block"
      aria-pressed={appState.activeFormatting.codeBlock}
    >
      <Code size={14} />
    </button>

    <button
      onclick={() => onCommand('horizontalRule')}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Horizontal Divider"
      aria-label="Horizontal Divider"
    >
      <Minus size={14} />
    </button>
  </div>

  <!-- Right Utility Tools -->
  <div class="flex items-center gap-1">
    <!-- Word wrap toggle -->
    <button
      onclick={() => {
        appState.wordWrap = !appState.wordWrap;
        appState.scheduleSessionSave();
      }}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer {appState.wordWrap ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-tertiary)]'}"
      title="Toggle Word Wrap"
      aria-label="Toggle Word Wrap"
    >
      <WrapText size={14} />
    </button>

    <!-- Find & Replace -->
    <button
      onclick={() => (appState.findReplaceOpen = !appState.findReplaceOpen)}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer {appState.findReplaceOpen ? 'text-[var(--accent)] font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}"
      title="Find & Replace (Ctrl+H)"
      aria-label="Find and Replace"
    >
      <Search size={14} />
    </button>

    <!-- Pin note -->
    {#if activeNote}
      <button
        onclick={() => appState.togglePinNote(activeNote.id, activeNote.pinned)}
        class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer {activeNote.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}"
        title={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
        aria-label={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
      >
        <Pin size={14} class={activeNote.pinned ? 'fill-current' : ''} />
      </button>

      <!-- Lock note -->
      <button
        onclick={() => {
          appState.targetNoteForPassword = activeNote;
          appState.passwordModalMode = activeNote.locked ? 'remove_lock' : 'lock';
          appState.passwordModalOpen = true;
        }}
        class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer {activeNote.locked ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}"
        title={activeNote.locked ? 'Remove Password Lock' : 'Lock Note'}
        aria-label={activeNote.locked ? 'Remove Password Lock' : 'Lock Note'}
      >
        <Lock size={14} />
      </button>
    {/if}

    <!-- Export Note -->
    <button
      onclick={onExport}
      class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Share & Export Note"
      aria-label="Share and Export Note"
    >
      <Share2 size={14} />
    </button>
  </div>
</div>

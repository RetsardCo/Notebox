<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import {
    Bold,
    Italic,
    Strikethrough,
    Highlighter,
    Heading1,
    Heading2,
    Heading3,
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
    ZoomIn,
    ZoomOut,
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
  class="h-10 px-3 flex items-center justify-between border-b select-none shrink-0 overflow-x-auto"
  style="background-color: var(--bg-toolbar); border-color: var(--border);"
>
  <!-- Left Formatting Tools -->
  <div class="flex items-center gap-0.5">
    <!-- Heading / Style Dropdown -->
    <select
      onchange={(e) => onCommand('heading', (e.target as HTMLSelectElement).value)}
      class="text-xs bg-transparent border rounded px-1.5 py-1 mr-1 outline-none cursor-pointer"
      style="border-color: var(--border); color: var(--text-primary);"
    >
      <option value="p">Paragraph</option>
      <option value="1">Heading 1</option>
      <option value="2">Heading 2</option>
      <option value="3">Heading 3</option>
    </select>

    <div class="w-px h-4 mx-1" style="background-color: var(--border);"></div>

    <!-- Text Styles -->
    <button
      onclick={() => onCommand('bold')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Bold (Ctrl+B)"
      style="color: var(--text-primary);"
    >
      <Bold size={15} />
    </button>

    <button
      onclick={() => onCommand('italic')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Italic (Ctrl+I)"
      style="color: var(--text-primary);"
    >
      <Italic size={15} />
    </button>

    <button
      onclick={() => onCommand('strike')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Strikethrough"
      style="color: var(--text-primary);"
    >
      <Strikethrough size={15} />
    </button>

    <button
      onclick={() => onCommand('highlight')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Highlight"
      style="color: var(--accent);"
    >
      <Highlighter size={15} />
    </button>

    <div class="w-px h-4 mx-1" style="background-color: var(--border);"></div>

    <!-- Lists & Checklists -->
    <button
      onclick={() => onCommand('taskList')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Checklist"
      style="color: var(--accent);"
    >
      <CheckSquare size={15} />
    </button>

    <button
      onclick={() => onCommand('bulletList')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Bullet List"
      style="color: var(--text-primary);"
    >
      <List size={15} />
    </button>

    <button
      onclick={() => onCommand('orderedList')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Numbered List"
      style="color: var(--text-primary);"
    >
      <ListOrdered size={15} />
    </button>

    <div class="w-px h-4 mx-1" style="background-color: var(--border);"></div>

    <!-- Blocks: Table, Image, Code, Quote, HR -->
    <button
      onclick={() => onCommand('insertTable')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Insert Table"
      style="color: var(--text-primary);"
    >
      <TableIcon size={15} />
    </button>

    <button
      onclick={onImageUpload}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Insert Image"
      style="color: var(--text-primary);"
    >
      <ImageIcon size={15} />
    </button>

    <button
      onclick={() => onCommand('blockquote')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Blockquote"
      style="color: var(--text-primary);"
    >
      <Quote size={15} />
    </button>

    <button
      onclick={() => onCommand('codeBlock')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Code Block"
      style="color: var(--text-primary);"
    >
      <Code size={15} />
    </button>

    <button
      onclick={() => onCommand('horizontalRule')}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      title="Horizontal Divider"
      style="color: var(--text-primary);"
    >
      <Minus size={15} />
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
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      style={appState.wordWrap ? 'color: var(--accent);' : 'color: var(--text-tertiary);'}
      title="Toggle Word Wrap"
    >
      <WrapText size={15} />
    </button>

    <!-- Find & Replace -->
    <button
      onclick={() => (appState.findReplaceOpen = !appState.findReplaceOpen)}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      style={appState.findReplaceOpen ? 'color: var(--accent);' : 'color: var(--text-primary);'}
      title="Find & Replace (Ctrl+H)"
    >
      <Search size={15} />
    </button>

    <!-- Pin note -->
    {#if activeNote}
      <button
        onclick={() => appState.togglePinNote(activeNote.id, activeNote.pinned)}
        class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
        style={activeNote.pinned ? 'color: var(--accent);' : 'color: var(--text-tertiary);'}
        title={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
      >
        <Pin size={15} class={activeNote.pinned ? 'fill-current' : ''} />
      </button>

      <!-- Lock note -->
      <button
        onclick={() => {
          appState.targetNoteForPassword = activeNote;
          appState.passwordModalMode = activeNote.locked ? 'remove_lock' : 'lock';
          appState.passwordModalOpen = true;
        }}
        class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
        style={activeNote.locked ? 'color: var(--accent);' : 'color: var(--text-tertiary);'}
        title={activeNote.locked ? 'Remove Password Lock' : 'Lock Note'}
      >
        <Lock size={15} />
      </button>
    {/if}

    <!-- Export Note -->
    <button
      onclick={onExport}
      class="p-1.5 rounded hover:opacity-75 transition cursor-pointer"
      style="color: var(--text-primary);"
      title="Share & Export Note"
    >
      <Share2 size={15} />
    </button>
  </div>
</div>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import { imageService, isTauri } from '$lib/services/ipc';
  import { markdownToHtml, htmlToMarkdown } from '$lib/utils/markdown';
  import { Editor } from '@tiptap/core';
  import { StarterKit } from '@tiptap/starter-kit';
  import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
  import { TaskList } from '@tiptap/extension-task-list';
  import { TaskItem } from '@tiptap/extension-task-item';
  import { Image } from '@tiptap/extension-image';
  import { Highlight } from '@tiptap/extension-highlight';
  import { Placeholder } from '@tiptap/extension-placeholder';
  import { Underline } from '@tiptap/extension-underline';
  import { FileText } from '@lucide/svelte';
  import { handleZoomWheel, createWheelAccumulator } from '$lib/utils/zoom';

  const CustomImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        'data-src': {
          default: null,
          parseHTML: (element) => element.getAttribute('data-src'),
          renderHTML: (attributes) => {
            if (!attributes['data-src']) return {};
            return { 'data-src': attributes['data-src'] };
          },
        },
      };
    },
  });

  let editorElement = $state<HTMLDivElement | null>(null);
  let editor: Editor | null = null;
  let fileInput = $state<HTMLInputElement | null>(null);
  let lastLoadedTabId: string | null = null;
  let lastLoadedContent = '';
  let isInternalUpdate = false;

  export function executeCommand(command: string, arg?: any) {
    if (!editor) return;

    switch (command) {
      case 'bold':
        editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        editor.chain().focus().toggleItalic().run();
        break;
      case 'strike':
        editor.chain().focus().toggleStrike().run();
        break;
      case 'underline':
        editor.chain().focus().toggleUnderline().run();
        break;
      case 'highlight':
        editor.chain().focus().toggleHighlight().run();
        break;
      case 'heading': {
        const level = parseInt(arg, 10);
        if (level === 1 || level === 2 || level === 3) {
          editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run();
        } else {
          editor.chain().focus().setParagraph().run();
        }
        break;
      }
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleTaskList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
      case 'horizontalRule':
        editor.chain().focus().setHorizontalRule().run();
        break;
      case 'insertTable':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'undo':
        editor.chain().focus().undo().run();
        break;
      case 'redo':
        editor.chain().focus().redo().run();
        break;
    }
  }

  export function triggerImageUpload() {
    if (fileInput) {
      fileInput.click();
    }
  }

  function getMatches(query: string): Array<{ from: number; to: number }> {
    if (!editor || !query) return [];
    const matches: Array<{ from: number; to: number }> = [];
    const lowerQuery = query.toLowerCase();
    editor.state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        const lowerText = node.text.toLowerCase();
        let index = 0;
        while ((index = lowerText.indexOf(lowerQuery, index)) !== -1) {
          matches.push({
            from: pos + index,
            to: pos + index + query.length,
          });
          index += query.length;
        }
      }
    });
    return matches;
  }

  export function findText(query: string, forward: boolean = true) {
    if (!editor || !query) return;
    const matches = getMatches(query);
    if (matches.length === 0) return;

    const { selection } = editor.state;
    const curPos = forward ? selection.to : selection.from;

    let target: { from: number; to: number } | null = null;
    if (forward) {
      target = matches.find((m) => m.from >= curPos) || matches[0];
    } else {
      const reversed = [...matches].reverse();
      target = reversed.find((m) => m.to <= curPos) || matches[matches.length - 1];
    }

    if (target) {
      editor.chain().focus().setTextSelection({ from: target.from, to: target.to }).scrollIntoView().run();
    }
  }

  export function replaceText(search: string, replaceWith: string) {
    if (!editor || !search) return;
    const { selection, doc } = editor.state;
    const selectedText = doc.textBetween(selection.from, selection.to);

    if (selectedText.toLowerCase() === search.toLowerCase()) {
      editor.chain().focus().insertContent(replaceWith).run();
      findText(search, true);
    } else {
      findText(search, true);
    }
  }

  export function replaceAllText(search: string, replaceWith: string) {
    if (!editor || !search) return;
    const matches = getMatches(search);
    if (matches.length === 0) return;

    const { tr } = editor.state;
    // Replace backwards so document positions remain valid
    for (let i = matches.length - 1; i >= 0; i--) {
      const m = matches[i];
      tr.insertText(replaceWith, m.from, m.to);
    }
    editor.view.dispatch(tr);
  }

  async function handleImageFile(file: File) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const noteId = appState.activeTab?.note_id || 'scratch';
        const relPath = await imageService.pasteImage(noteId, base64);
        const dataUrl = await imageService.getImageData(relPath);
        if (editor) {
          editor.chain().focus().setImage({ src: dataUrl, alt: file.name, 'data-src': relPath } as any).run();
        }
      } catch (e) {
        console.error('Failed to embed image:', e);
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFileInputChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      handleImageFile(input.files[0]);
    }
    input.value = '';
  }

  function handlePaste(e: ClipboardEvent) {
    if (e.clipboardData && e.clipboardData.items) {
      for (let i = 0; i < e.clipboardData.items.length; i++) {
        const item = e.clipboardData.items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageFile(file);
          }
          return;
        }
      }
    }
  }

  function handleDrop(e: DragEvent) {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleImageFile(file);
      }
    }
  }

  function updateMetricsFromEditor() {
    if (!editor) return;
    const { selection, doc } = editor.state;
    const from = selection.from;
    const textUpToCursor = doc.textBetween(0, from, '\n');
    const lines = textUpToCursor.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;
    const fullText = editor.getText();
    appState.updateMetrics(lineNum, colNum, fullText);
  }

  function initEditor() {
    if (!editorElement || editor) return;

    editor = new Editor({
      element: editorElement,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        CustomImage.configure({
          inline: false,
          allowBase64: true,
        }),
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableHeader,
        TableCell,
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        Highlight,
        Underline,
        Placeholder.configure({
          placeholder: 'Write your thoughts, checklists, notes...',
        }),
      ],
      editorProps: {
        attributes: {
          class: 'focus:outline-none min-h-full leading-relaxed select-text cursor-text',
          style: `font-size: ${appState.fontSize}px;`,
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (isInternalUpdate || !ed.isFocused) return;
        const html = ed.getHTML();
        const md = htmlToMarkdown(html);
        if (md === lastLoadedContent) return;
        lastLoadedContent = md;
        appState.updateTabContent(md);
        updateMetricsFromEditor();
      },
      onSelectionUpdate: () => {
        updateMetricsFromEditor();
      },
    });

    if (appState.activeTab) {
      loadTabContent(appState.activeTab.id, appState.activeTab.content);
    }
  }

  onMount(() => {
    initEditor();
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  async function loadTabContent(tabId: string, content: string) {
    if (!editor) {
      initEditor();
      if (!editor) return;
    }
    editor.setEditable(true);
    isInternalUpdate = true;
    lastLoadedTabId = tabId;
    lastLoadedContent = content;

    // Clean leading duplicate H1 heading matching note title (so title is not rendered twice)
    let cleanedContent = content;
    const tabTitle = appState.activeTab?.title;
    if (tabTitle && tabTitle.trim().length > 0) {
      const escaped = tabTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const leadingH1Regex = new RegExp(`^#\\s+${escaped}\\s*\\r?\\n+`, 'i');
      if (leadingH1Regex.test(cleanedContent)) {
        cleanedContent = cleanedContent.replace(leadingH1Regex, '');
      }
    }
    const genericH1Regex = /^#\s+(?:Untitled Note|Untitled)\s*\r?\n+/i;
    if (genericH1Regex.test(cleanedContent)) {
      cleanedContent = cleanedContent.replace(genericH1Regex, '');
    }

    // Keep tab.content and lastLoadedContent synchronized with cleanedContent
    // without marking dirty, ensuring onUpdate or reactivity effects never trigger a false auto-save
    if (appState.activeTab && appState.activeTab.id === tabId && appState.activeTab.content !== cleanedContent) {
      appState.activeTab.content = cleanedContent;
    }
    lastLoadedContent = cleanedContent;

    let html = markdownToHtml(cleanedContent);

    // Resolve any relative image paths (e.g. .assets/images/...)
    if (isTauri && html.includes('.assets/images/')) {
      const imgRegex = /<img([^>]*?)data-src="(\.assets\/images\/[^"]+)"([^>]*?)>/g;
      const matches = [...html.matchAll(imgRegex)];
      for (const m of matches) {
        const fullTag = m[0];
        const relPath = m[2];
        try {
          const dataUrl = await imageService.getImageData(relPath);
          const updatedTag = fullTag.replace(/src="[^"]*"/, `src="${dataUrl}"`);
          html = html.replace(fullTag, updatedTag);
        } catch (e) {
          console.warn('Failed to load image data for:', relPath, e);
        }
      }
    }

    editor.commands.setContent(html, { emitUpdate: false });
    setTimeout(() => { isInternalUpdate = false; }, 300);
    updateMetricsFromEditor();
  }

  function handleEditorClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Never steal focus or interfere if clicking title input, buttons, inputs, links, or header area
    if (target.closest('input, textarea, button, a, select, [contenteditable="true"], .note-metadata-line, .note-header-area')) {
      return;
    }

    const wikiTarget = target.closest('.wiki-link');
    if (wikiTarget) {
      e.preventDefault();
      const title = wikiTarget.getAttribute('data-wiki-title') || wikiTarget.textContent;
      if (title) {
        appState.openNoteByTitle(title);
      }
      return;
    }

    // Only focus editor if clicked inside or below the ProseMirror editor element, never in header/title area
    if (editor && editorElement) {
      const editorRect = editorElement.getBoundingClientRect();
      if (e.clientY >= editorRect.top && !target.closest('.ProseMirror')) {
        editor.setEditable(true);
        editor.chain().focus('end').run();
      }
    }
  }

  const wheelAccumulator = createWheelAccumulator();

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const { handled, newZoom } = handleZoomWheel(e, appState.zoomLevel, wheelAccumulator);
      if (handled) {
        appState.setZoomLevel(newZoom);
      }
    }
  }

  // React to tab switch or note unlock/content sync
  $effect(() => {
    if (editorElement && !editor) {
      initEditor();
    }
    const tab = appState.activeTab;
    if (tab && editor) {
      if (tab.id !== lastLoadedTabId || (!tab.is_dirty && tab.content !== lastLoadedContent)) {
        loadTabContent(tab.id, tab.content);
      }
    }
  });

  let currentNoteTitle = $state('');
  let titleInputElement = $state<HTMLInputElement | null>(null);
  let lastActiveTabId: string | null = null;

  // Synchronize title with active tab safely without resetting cursor when typing
  $effect(() => {
    const tab = appState.activeTab;
    const tabId = tab?.id ?? null;
    if (tabId !== lastActiveTabId) {
      lastActiveTabId = tabId;
      currentNoteTitle = tab?.title || '';
    } else if (tab && document.activeElement !== titleInputElement) {
      currentNoteTitle = tab.title || '';
    } else if (!tab) {
      currentNoteTitle = '';
    }
  });

  function handleTitleInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    currentNoteTitle = val;
    appState.updateActiveNoteTitle(val);
  }

  function handleTitleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.chain().focus('start').run();
      }
    }
  }

  function getNoteMetadata(tab: any): { date: string; folder: string; readTime: string } {
    const note = tab?.note_id ? appState.notes.find((n) => n.id === tab.note_id) : null;
    const dateStr = note?.updated_at || new Date().toISOString();
    let formattedDate = 'Today';
    try {
      const d = new Date(dateStr);
      formattedDate = d.toLocaleDateString([], { month: 'long', day: 'numeric' });
    } catch {}
    const folder = note?.folder_name || 'Personal';
    const words = appState.wordCount || note?.word_count || 0;
    const readTime = `${Math.max(1, Math.ceil(words / 200))} min read`;
    return { date: formattedDate, folder, readTime };
  }
</script>

<input
  type="file"
  accept="image/*"
  bind:this={fileInput}
  onchange={handleFileInputChange}
  class="hidden"
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="flex-1 h-full overflow-y-auto {appState.wordWrap ? '' : 'overflow-x-auto'} relative select-text editor-outer-container"
  style="background-color: var(--bg-editor);"
  onwheel={handleWheel}
  onpaste={handlePaste}
  ondrop={handleDrop}
  ondragover={(e) => e.preventDefault()}
  onclick={handleEditorClick}
  role="region"
  aria-label="Note Editor"
>
  <!-- Editor Page Canvas: ALWAYS mounted to ensure TipTap binds cleanly on startup -->
  <div
    class="min-h-full w-full flex justify-center editor-page-container {!appState.activeTab ? 'hidden' : ''}"
    style="zoom: {appState.zoomLevel}%;"
  >
    <div
      class="w-full max-w-4xl px-8 sm:px-10 pt-7 pb-12 min-h-full flex flex-col editor-content-container"
    >
      {#if appState.activeTab}
        {@const meta = getNoteMetadata(appState.activeTab)}
        <div class="note-header-area shrink-0 select-text" onclick={(e) => e.stopPropagation()} onmousedown={(e) => e.stopPropagation()}>
          <!-- Dedicated Large Note Title Input (Fully editable) -->
          <input
            bind:this={titleInputElement}
            type="text"
            bind:value={currentNoteTitle}
            oninput={handleTitleInput}
            onkeydown={handleTitleKeyDown}
            onmousedown={(e) => e.stopPropagation()}
            onclick={(e) => e.stopPropagation()}
            placeholder="Untitled Note"
            class="w-full text-3xl font-bold tracking-tight bg-transparent border-none outline-none mb-2 select-text cursor-text"
            style="color: var(--text-primary);"
          />

          <div class="note-metadata-line px-0.5 mb-4 flex items-center gap-2 select-none text-xs font-medium" style="color: var(--text-tertiary);">
            <span>{meta.date}</span>
            <span class="opacity-40">•</span>
            <span class="capitalize">{meta.folder}</span>
            <span class="opacity-40">•</span>
            <span>{meta.readTime}</span>
          </div>

          <!-- Subtle horizontal divider line beneath metadata matching Image 3 -->
          <div class="border-b mb-6" style="border-color: var(--border-subtle);"></div>
        </div>
      {/if}

      <div
        bind:this={editorElement}
        class="flex-1 min-h-[500px] cursor-text select-text {appState.wordWrap ? '' : 'whitespace-pre overflow-x-auto'}"
      ></div>
    </div>
  </div>

  <!-- Empty state overlay when no tab is open -->
  {#if !appState.activeTab}
    <div
      class="absolute inset-0 flex flex-col items-center justify-center text-center p-8 select-none"
      style="background-color: var(--bg-editor); color: var(--text-tertiary);"
    >
      <div
        class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
        style="background-color: var(--border-subtle);"
      >
        <img src="/notebox-icon.png" class="w-9 h-9 object-contain drop-shadow-xs" alt="Notebox" />
      </div>
      <p class="text-base font-semibold mb-1.5" style="color: var(--text-primary);">No Note Open</p>
      <p class="text-xs max-w-xs mb-5 leading-relaxed">Select a note from the list, or create a new note to start writing.</p>
      <button
        onclick={() => appState.createNewNote()}
        class="px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-sm hover:brightness-105 active:scale-95 transition-all"
        style="background-color: var(--accent); color: #000;"
      >
        New Note
      </button>
    </div>
  {/if}
</div>

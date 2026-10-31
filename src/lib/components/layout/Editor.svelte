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

  let editorElement: HTMLDivElement | null = null;
  let editor: Editor | null = null;
  let fileInput: HTMLInputElement | null = null;
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

  onMount(() => {
    if (!editorElement) return;

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
        Placeholder.configure({
          placeholder: 'Write your thoughts, checklists, notes...',
        }),
      ],
      editorProps: {
        attributes: {
          class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-full p-6 md:p-10',
          style: `font-size: ${appState.fontSize}px;`,
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (isInternalUpdate) return;
        const html = ed.getHTML();
        const md = htmlToMarkdown(html);
        lastLoadedContent = md;
        appState.updateTabContent(md);
        updateMetricsFromEditor();
      },
      onSelectionUpdate: () => {
        updateMetricsFromEditor();
      },
    });

    // Initial load
    if (appState.activeTab) {
      loadTabContent(appState.activeTab.id, appState.activeTab.content);
    }
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });

  async function loadTabContent(tabId: string, content: string) {
    if (!editor) return;
    isInternalUpdate = true;
    lastLoadedTabId = tabId;
    lastLoadedContent = content;
    let html = markdownToHtml(content);

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

    editor.commands.setContent(html);
    isInternalUpdate = false;
    updateMetricsFromEditor();
  }

  function handleEditorClick(e: MouseEvent) {
    const target = (e.target as HTMLElement).closest('.wiki-link');
    if (target) {
      e.preventDefault();
      const title = target.getAttribute('data-wiki-title') || target.textContent;
      if (title) {
        appState.openNoteByTitle(title);
      }
    }
  }

  // React to tab switch or note unlock/content sync
  $effect(() => {
    const tab = appState.activeTab;
    if (tab) {
      if (tab.id !== lastLoadedTabId || (!tab.is_dirty && tab.content !== lastLoadedContent)) {
        loadTabContent(tab.id, tab.content);
      }
    }
  });
</script>

<input
  type="file"
  accept="image/*"
  bind:this={fileInput}
  onchange={handleFileInputChange}
  class="hidden"
/>

<div
  class="flex-1 h-full overflow-y-auto {appState.wordWrap ? '' : 'overflow-x-auto'} relative select-text"
  style="background-color: var(--bg-editor); zoom: {appState.zoomLevel}%;"
  onpaste={handlePaste}
  ondrop={handleDrop}
  ondragover={(e) => e.preventDefault()}
  onclick={handleEditorClick}
>
  <div
    bind:this={editorElement}
    class="min-h-full max-w-4xl mx-auto {appState.wordWrap ? '' : 'min-w-max'}"
    style="white-space: {appState.wordWrap ? 'pre-wrap' : 'pre'}; word-break: {appState.wordWrap ? 'break-word' : 'normal'};"
  ></div>
</div>

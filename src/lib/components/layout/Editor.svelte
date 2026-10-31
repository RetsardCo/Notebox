<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import { imageService } from '$lib/services/ipc';
  import { markdownToHtml, htmlToMarkdown } from '$lib/utils/markdown';
  import { Editor } from '@tiptap/core';
  import { StarterKit } from '@tiptap/starter-kit';
  import { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
  import { TaskList } from '@tiptap/extension-task-list';
  import { TaskItem } from '@tiptap/extension-task-item';
  import { Image } from '@tiptap/extension-image';
  import { Highlight } from '@tiptap/extension-highlight';
  import { Placeholder } from '@tiptap/extension-placeholder';

  let editorElement: HTMLDivElement | null = null;
  let editor: Editor | null = null;
  let fileInput: HTMLInputElement | null = null;
  let lastLoadedTabId: string | null = null;
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

  export function findText(query: string, forward: boolean = true) {
    if (!editor || !query) return;
    const text = editor.getText();
    const doc = editor.state.doc;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();

    const idx = lowerText.indexOf(lowerQuery);
    if (idx !== -1) {
      editor.chain().focus().setTextSelection({ from: idx + 1, to: idx + 1 + query.length }).run();
    }
  }

  export function replaceText(search: string, replaceWith: string) {
    if (!editor || !search) return;
    const currentSelection = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(currentSelection.from, currentSelection.to);

    if (selectedText.toLowerCase() === search.toLowerCase()) {
      editor.chain().focus().insertContent(replaceWith).run();
    } else {
      findText(search, true);
    }
  }

  export function replaceAllText(search: string, replaceWith: string) {
    if (!editor || !search) return;
    const currentHtml = editor.getHTML();
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newHtml = currentHtml.replace(regex, replaceWith);
    editor.commands.setContent(newHtml);
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
          editor.chain().focus().setImage({ src: dataUrl, alt: file.name }).run();
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
        Image.configure({
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

  function loadTabContent(tabId: string, content: string) {
    if (!editor) return;
    isInternalUpdate = true;
    lastLoadedTabId = tabId;
    const html = markdownToHtml(content);
    editor.commands.setContent(html);
    isInternalUpdate = false;
    updateMetricsFromEditor();
  }

  // React to tab switch
  $effect(() => {
    const tab = appState.activeTab;
    if (tab && tab.id !== lastLoadedTabId) {
      loadTabContent(tab.id, tab.content);
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
  class="flex-1 h-full overflow-y-auto relative select-text"
  style="background-color: var(--bg-editor); zoom: {appState.zoomLevel}%;"
  onpaste={handlePaste}
  ondrop={handleDrop}
  ondragover={(e) => e.preventDefault()}
>
  <div
    bind:this={editorElement}
    class="min-h-full max-w-4xl mx-auto"
    style="white-space: {appState.wordWrap ? 'pre-wrap' : 'pre'}; word-break: break-word;"
  ></div>
</div>

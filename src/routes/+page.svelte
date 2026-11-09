<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import TitleBar from '$lib/components/layout/TitleBar.svelte';
  import Sidebar from '$lib/components/layout/Sidebar.svelte';
  import NoteList from '$lib/components/layout/NoteList.svelte';
  import TabBar from '$lib/components/layout/TabBar.svelte';
  import Toolbar from '$lib/components/layout/Toolbar.svelte';
  import FindReplace from '$lib/components/layout/FindReplace.svelte';
  import Editor from '$lib/components/layout/Editor.svelte';
  import StatusBar from '$lib/components/layout/StatusBar.svelte';
  import SettingsModal from '$lib/components/modals/SettingsModal.svelte';
  import PasswordModal from '$lib/components/modals/PasswordModal.svelte';
  import ExportModal from '$lib/components/modals/ExportModal.svelte';
  import { handleZoomKey } from '$lib/utils/zoom';

  let editorComponent: any = null;
  let exportModalOpen = $state(false);

  // Splitter dragging
  let isDraggingSidebar = $state(false);
  let isDraggingNoteList = $state(false);

  function onMouseDownSidebarSplitter(e: MouseEvent) {
    e.preventDefault();
    isDraggingSidebar = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMoveSplitter);
    window.addEventListener('mouseup', onMouseUpSplitter);
  }

  function onMouseDownNoteListSplitter(e: MouseEvent) {
    e.preventDefault();
    isDraggingNoteList = true;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';
    window.addEventListener('mousemove', onMouseMoveSplitter);
    window.addEventListener('mouseup', onMouseUpSplitter);
  }

  function onMouseMoveSplitter(e: MouseEvent) {
    const workspace = document.querySelector('.workspace-container');
    const workspaceLeft = workspace?.getBoundingClientRect().left ?? 0;
    const outerGutter = 10;
    const panelGutter = 10;

    if (isDraggingSidebar) {
      const newWidth = Math.max(200, Math.min(380, e.clientX - workspaceLeft - outerGutter));
      appState.sidebarWidth = newWidth;
    } else if (isDraggingNoteList) {
      const currentSidebarWidth = appState.sidebarCollapsed ? 0 : appState.sidebarWidth;
      const sidebarGutter = appState.sidebarCollapsed ? 0 : panelGutter;
      const newWidth = Math.max(240, Math.min(480, e.clientX - workspaceLeft - outerGutter - currentSidebarWidth - sidebarGutter));
      appState.noteListWidth = newWidth;
    }
  }

  function onMouseUpSplitter() {
    isDraggingSidebar = false;
    isDraggingNoteList = false;
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMoveSplitter);
    window.removeEventListener('mouseup', onMouseUpSplitter);
    appState.scheduleSessionSave();
  }

  function handleKeydown(e: KeyboardEvent) {
    // Check for Ctrl (or Cmd on Mac)
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && !e.shiftKey && !e.altKey && e.key.toLowerCase() === 'c') {
      const activeEl = document.activeElement;
      let text = '';
      if (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement) {
        const start = activeEl.selectionStart ?? 0;
        const end = activeEl.selectionEnd ?? 0;
        if (start !== end) {
          text = activeEl.value.substring(start, end);
        }
      }
      if (!text) {
        text = window.getSelection()?.toString() || '';
      }
      if (text && text.length > 0) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
      e.preventDefault();
      appState.createNewNote();
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      appState.createScratchTab();
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'w') {
      e.preventDefault();
      if (appState.activeTabId) {
        appState.closeTab(appState.activeTabId);
      }
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      appState.saveActiveNote();
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      exportModalOpen = true;
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      appState.findReplaceOpen = true;
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'h') {
      e.preventDefault();
      appState.findReplaceOpen = !appState.findReplaceOpen;
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'd') {
      e.preventDefault();
      appState.toggleTheme();
    } else if (ctrl && !e.shiftKey && e.key === '\\') {
      e.preventDefault();
      appState.toggleSidebar();
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      if (appState.activeTab?.note_id) {
        const n = appState.notes.find((x) => x.id === appState.activeTab?.note_id);
        if (n) appState.togglePinNote(n.id, n.pinned);
      }
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      exportModalOpen = true;
    } else if (ctrl && !e.shiftKey && (e.key === '1' || e.key === '2' || e.key === '3')) {
      e.preventDefault();
      editorComponent?.executeCommand('heading', parseInt(e.key, 10));
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'c') {
      e.preventDefault();
      editorComponent?.executeCommand('taskList');
    } else if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (appState.sidebarCollapsed) {
        appState.toggleSidebar();
      }
      setTimeout(() => {
        const searchEl = document.getElementById('sidebar-search-input') as HTMLInputElement | null;
        if (searchEl) {
          searchEl.focus();
          searchEl.select();
        }
      }, 50);
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      editorComponent?.executeCommand('codeBlock');
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 't') {
      e.preventDefault();
      editorComponent?.executeCommand('insertTable');
    } else if (ctrl && e.shiftKey && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      editorComponent?.triggerImageUpload();
    } else if (ctrl && e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) appState.prevTab();
      else appState.nextTab();
    } else {
      const zoomResult = handleZoomKey(e, appState.zoomLevel);
      if (zoomResult.handled) {
        appState.setZoomLevel(zoomResult.newZoom);
        return;
      }
    }
  }

  function handleWindowWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }

  onMount(() => {
    appState.init();
    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('wheel', handleWindowWheel, { passive: false });
    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('wheel', handleWindowWheel);
    };
  });
</script>

<svelte:head>
  <title>Notebox — {appState.activeTab?.title || 'Notes'}</title>
</svelte:head>

<div class="w-screen h-screen flex flex-col overflow-hidden" style="background-color: var(--bg-titlebar);">
  <!-- Custom macOS Window Titlebar with 3 Interactive Dots -->
  <TitleBar />

  <!-- Three-panel workspace with consistent island gutters -->
  <main class="flex-1 flex flex-row overflow-hidden min-h-0 workspace-container">
    <!-- Column 1: Sidebar (Folders, Smart Folders, Tags) -->
    {#if !appState.sidebarCollapsed}
      <aside
        class="sidebar-panel transition-[width] duration-200 ease-in-out"
        class:transition-none={isDraggingSidebar || isDraggingNoteList}
        style="width: {appState.sidebarWidth}px;"
      >
        <Sidebar />
      </aside>

      <!-- Sidebar resize gutter -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="splitter-handle transition-colors {isDraggingSidebar ? 'is-dragging' : ''}"
        onmousedown={onMouseDownSidebarSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.sidebarWidth}
      ></div>
    {/if}

    <!-- Column 2: Note Cards List -->
    {#if !appState.noteListCollapsed}
      <section
        class="notelist-panel transition-[width] duration-200 ease-in-out"
        class:transition-none={isDraggingSidebar || isDraggingNoteList}
        style="width: {appState.noteListWidth}px;"
      >
        <NoteList />
      </section>

      <!-- Notes-list resize gutter -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="splitter-handle transition-colors {isDraggingNoteList ? 'is-dragging' : ''}"
        onmousedown={onMouseDownNoteListSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.noteListWidth}
      ></div>
    {/if}

    <!-- Column 3: Main Editor Area (Tabs, Toolbar, Editor, Status Bar) -->
    <section class="editor-panel">
      <!-- Tab Bar (Horizontal mouse-wheel scrolling, conditional chevrons, pinned + button) -->
      <TabBar />

      <!-- Formatting Toolbar -->
      <Toolbar
        onCommand={(cmd, arg) => editorComponent?.executeCommand(cmd, arg)}
        onImageUpload={() => editorComponent?.triggerImageUpload()}
        onExport={() => (exportModalOpen = true)}
      />

      <!-- In-Note Find & Replace Bar (Ctrl+H) -->
      <FindReplace
        onFind={(q, f) => editorComponent?.findText(q, f)}
        onReplace={(s, r) => editorComponent?.replaceText(s, r)}
        onReplaceAll={(s, r) => editorComponent?.replaceAllText(s, r)}
      />

      <!-- TipTap Markdown Editor with dedicated Title -->
      <Editor bind:this={editorComponent} />

      <!-- Status Bar -->
      <StatusBar />
    </section>
  </main>
</div>

<!-- Modals -->
<SettingsModal />
<PasswordModal />
<ExportModal open={exportModalOpen} onClose={() => (exportModalOpen = false)} />

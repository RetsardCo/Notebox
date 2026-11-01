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
    isDraggingSidebar = true;
    window.addEventListener('mousemove', onMouseMoveSplitter);
    window.addEventListener('mouseup', onMouseUpSplitter);
  }

  function onMouseDownNoteListSplitter(e: MouseEvent) {
    isDraggingNoteList = true;
    window.addEventListener('mousemove', onMouseMoveSplitter);
    window.addEventListener('mouseup', onMouseUpSplitter);
  }

  function onMouseMoveSplitter(e: MouseEvent) {
    if (isDraggingSidebar) {
      // 10px workspace gutter offset
      const newWidth = Math.max(200, Math.min(380, e.clientX - 10));
      appState.sidebarWidth = newWidth;
    } else if (isDraggingNoteList) {
      // 10px workspace gutter + 10px panel gutter
      const currentSidebarWidth = appState.sidebarCollapsed ? 0 : (appState.sidebarWidth + 10);
      const newWidth = Math.max(240, Math.min(480, e.clientX - currentSidebarWidth - 10));
      appState.noteListWidth = newWidth;
    }
  }

  function onMouseUpSplitter() {
    isDraggingSidebar = false;
    isDraggingNoteList = false;
    window.removeEventListener('mousemove', onMouseMoveSplitter);
    window.removeEventListener('mouseup', onMouseUpSplitter);
    appState.scheduleSessionSave();
  }

  function handleKeydown(e: KeyboardEvent) {
    // Check for Ctrl (or Cmd on Mac)
    const ctrl = e.ctrlKey || e.metaKey;

    if (ctrl && !e.shiftKey && e.key.toLowerCase() === 'n') {
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

<div class="w-screen h-screen flex flex-col overflow-hidden" style="background-color: var(--bg-canvas);">
  <!-- Custom macOS Window Titlebar with 3 Interactive Dots -->
  <TitleBar />

  <!-- 3-Column Layout with 10px Workspace Gutter & 10px Panel-to-Panel Gutter -->
  <main class="flex-1 flex flex-row overflow-hidden min-h-0 p-[10px] gap-[10px]" style="background-color: var(--bg-canvas);">
    <!-- Column 1: Sidebar (Folders, Smart Folders, Tags) -->
    {#if !appState.sidebarCollapsed}
      <aside
        class="h-full flex flex-col shrink-0 rounded-[12px] border border-[var(--border-subtle)] shadow-xs overflow-hidden transition-[width] duration-200 ease-in-out"
        style="width: {appState.sidebarWidth}px; background-color: var(--bg-sidebar);"
      >
        <Sidebar />
      </aside>

      <!-- Sidebar Resize Splitter Handle (10px gutter centered handle) -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-[10px] -mx-[5px] h-full cursor-col-resize flex items-center justify-center group z-20 shrink-0 select-none"
        onmousedown={onMouseDownSidebarSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.sidebarWidth}
      >
        <div class="w-1 h-8 rounded-full transition-all group-hover:h-14 group-hover:bg-[var(--accent)] bg-black/10 dark:bg-white/10 {isDraggingSidebar ? '!h-16 !bg-[var(--accent)]' : ''}"></div>
      </div>
    {/if}

    <!-- Column 2: Note Cards List -->
    {#if !appState.noteListCollapsed}
      <section
        class="h-full flex flex-col shrink-0 rounded-[12px] border border-[var(--border-subtle)] shadow-xs overflow-hidden transition-[width] duration-200 ease-in-out"
        style="width: {appState.noteListWidth}px; background-color: var(--bg-notelist);"
      >
        <NoteList />
      </section>

      <!-- NoteList Resize Splitter Handle (10px gutter centered handle) -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-[10px] -mx-[5px] h-full cursor-col-resize flex items-center justify-center group z-20 shrink-0 select-none"
        onmousedown={onMouseDownNoteListSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.noteListWidth}
      >
        <div class="w-1 h-8 rounded-full transition-all group-hover:h-14 group-hover:bg-[var(--accent)] bg-black/10 dark:bg-white/10 {isDraggingNoteList ? '!h-16 !bg-[var(--accent)]' : ''}"></div>
      </div>
    {/if}

    <!-- Column 3: Main Editor Area (Tabs, Toolbar, Editor, Status Bar) -->
    <section
      class="flex-1 flex flex-col h-full rounded-[12px] border border-[var(--border-subtle)] shadow-xs overflow-hidden min-w-[360px]"
      style="background-color: var(--bg-editor);"
    >
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

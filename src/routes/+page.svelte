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
      const newWidth = Math.max(240, Math.min(420, e.clientX));
      appState.sidebarWidth = newWidth;
    } else if (isDraggingNoteList) {
      const currentSidebarWidth = appState.sidebarCollapsed ? 0 : appState.sidebarWidth;
      const newWidth = Math.max(300, Math.min(500, e.clientX - currentSidebarWidth));
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
    } else if (ctrl && (e.key === '=' || e.key === '+')) {
      e.preventDefault();
      if (appState.zoomLevel < 200) appState.zoomLevel += 10;
    } else if (ctrl && e.key === '-') {
      e.preventDefault();
      if (appState.zoomLevel > 60) appState.zoomLevel -= 10;
    } else if (ctrl && e.key === '0') {
      e.preventDefault();
      appState.zoomLevel = 100;
    }
  }

  onMount(() => {
    appState.init();
    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

<svelte:head>
  <title>Notebox — {appState.activeTab?.title || 'Notes'}</title>
</svelte:head>

<div class="w-screen h-screen flex flex-col overflow-hidden select-none" style="background-color: var(--bg-canvas);">
  <!-- Custom macOS Window Titlebar with 3 Interactive Dots -->
  <TitleBar />

  <!-- 3-Column Floating Island Canvas (10px canvas gutter, 10px panel separation) -->
  <main class="flex-1 flex flex-row overflow-hidden min-h-0 p-2.5 gap-2.5" style="background-color: var(--bg-canvas);">
    <!-- Column 1: Sidebar Island -->
    {#if !appState.sidebarCollapsed}
      <div
        class="h-full flex flex-col shrink-0 rounded-2xl border shadow-xs overflow-hidden {isDraggingSidebar ? '' : 'transition-[width] duration-200 ease-in-out'}"
        style="width: {appState.sidebarWidth}px; background-color: var(--bg-sidebar); border-color: var(--border);"
      >
        <Sidebar />
      </div>

      <!-- Sidebar Resize Splitter Handle -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-2.5 -mx-1.25 h-full cursor-col-resize flex items-center justify-center group z-20 shrink-0 select-none"
        onmousedown={onMouseDownSidebarSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.sidebarWidth}
      >
        <div class="w-0.5 h-6 rounded-full transition-all group-hover:h-12 group-hover:w-1 group-hover:bg-[var(--accent)] bg-black/10 dark:bg-white/10 {isDraggingSidebar ? '!h-14 !w-1 !bg-[var(--accent)]' : ''}"></div>
      </div>
    {/if}

    <!-- Column 2: Note Cards List Island -->
    {#if !appState.noteListCollapsed}
      <div
        class="h-full flex flex-col shrink-0 rounded-2xl border shadow-xs overflow-hidden {isDraggingNoteList ? '' : 'transition-[width] duration-200 ease-in-out'}"
        style="width: {appState.noteListWidth}px; background-color: var(--bg-notelist); border-color: var(--border);"
      >
        <NoteList />
      </div>

      <!-- NoteList Resize Splitter Handle -->
      <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
      <div
        class="w-2.5 -mx-1.25 h-full cursor-col-resize flex items-center justify-center group z-20 shrink-0 select-none"
        onmousedown={onMouseDownNoteListSplitter}
        role="separator"
        tabindex="-1"
        aria-orientation="vertical"
        aria-valuenow={appState.noteListWidth}
      >
        <div class="w-0.5 h-6 rounded-full transition-all group-hover:h-12 group-hover:w-1 group-hover:bg-[var(--accent)] bg-black/10 dark:bg-white/10 {isDraggingNoteList ? '!h-14 !w-1 !bg-[var(--accent)]' : ''}"></div>
      </div>
    {/if}

    <!-- Column 3: Main Area Island (Tabs, Toolbar, Editor, Status Bar) -->
    <section
      class="flex-1 flex flex-col h-full rounded-2xl border shadow-xs overflow-hidden min-w-[320px]"
      style="background-color: var(--bg-editor); border-color: var(--border);"
    >
      <!-- Tab Bar (Windows 11 Notepad-style Tabs with Scroll Controls) -->
      <TabBar />

      <!-- Apple Notes Formatting Toolbar -->
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

      <!-- TipTap Markdown Editor -->
      <Editor bind:this={editorComponent} />

      <!-- Windows 11 Notepad Status Bar -->
      <StatusBar />
    </section>
  </main>
</div>

<!-- Modals -->
<SettingsModal />
<PasswordModal />
<ExportModal open={exportModalOpen} onClose={() => (exportModalOpen = false)} />

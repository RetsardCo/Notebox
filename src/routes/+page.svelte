<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
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
  let isDraggingSidebar = false;
  let isDraggingNoteList = false;

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
      const newWidth = Math.max(160, Math.min(380, e.clientX));
      appState.sidebarWidth = newWidth;
    } else if (isDraggingNoteList) {
      const newWidth = Math.max(200, Math.min(450, e.clientX - appState.sidebarWidth));
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
      appState.sidebarCollapsed = !appState.sidebarCollapsed;
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
  <title>NoteFlow — {appState.activeTab?.title || 'Notes'}</title>
</svelte:head>

<main class="w-screen h-screen flex flex-row overflow-hidden select-none">
  <!-- Column 1: Sidebar (Folders, Smart Folders, Tags) -->
  {#if !appState.sidebarCollapsed}
    <Sidebar />

    <!-- Sidebar Resize Handle -->
    <div
      class="w-1 hover:w-1.5 h-full cursor-col-resize hover:bg-amber-400/50 transition-colors z-20 shrink-0"
      onmousedown={onMouseDownSidebarSplitter}
      role="separator"
      tabindex="-1"
    ></div>
  {/if}

  <!-- Column 2: Note Cards List -->
  {#if !appState.noteListCollapsed}
    <NoteList />

    <!-- NoteList Resize Handle -->
    <div
      class="w-1 hover:w-1.5 h-full cursor-col-resize hover:bg-amber-400/50 transition-colors z-20 shrink-0"
      onmousedown={onMouseDownNoteListSplitter}
      role="separator"
      tabindex="-1"
    ></div>
  {/if}

  <!-- Column 3: Main Area (Tabs, Toolbar, Editor, Status Bar) -->
  <section class="flex-1 flex flex-col h-full overflow-hidden min-w-[320px]">
    <!-- Tab Bar (Windows 11 Notepad-style Tabs) -->
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

<!-- Modals -->
<SettingsModal />
<PasswordModal />
<ExportModal open={exportModalOpen} onClose={() => (exportModalOpen = false)} />

<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { Check, Loader2, Minus, Plus } from '@lucide/svelte';

  function zoomIn() {
    if (appState.zoomLevel < 200) {
      appState.zoomLevel += 10;
    }
  }

  function zoomOut() {
    if (appState.zoomLevel > 60) {
      appState.zoomLevel -= 10;
    }
  }

  function resetZoom() {
    appState.zoomLevel = 100;
  }
</script>

<footer
  class="h-7 px-3.5 flex items-center justify-between border-t text-[11px] select-none shrink-0"
  style="background-color: var(--bg-statusbar); border-color: var(--border-subtle); color: var(--text-tertiary);"
>
  <!-- Left Side: Status & Counts -->
  <div class="flex items-center gap-3">
    <!-- Save Indicator -->
    <div class="flex items-center gap-1.5 font-medium">
      {#if appState.saveStatus === 'saving'}
        <Loader2 size={12} class="animate-spin text-amber-500" />
        <span class="text-amber-500">Saving...</span>
      {:else if appState.saveStatus === 'dirty'}
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>Unsaved</span>
      {:else}
        <Check size={12} class="text-emerald-500" />
        <span class="text-emerald-500">Saved</span>
      {/if}
    </div>

    <div class="w-px h-3 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Word & Character Counts -->
    <span>{appState.wordCount} {appState.wordCount === 1 ? 'word' : 'words'}</span>
    <span>{appState.charCount} {appState.charCount === 1 ? 'character' : 'characters'}</span>

    {#if appState.currentBacklinks.length > 0}
      <div class="w-px h-3 opacity-40 shrink-0" style="background-color: var(--border);"></div>
      <div
        class="flex items-center gap-1 font-medium"
        style="color: var(--accent);"
        title={appState.currentBacklinks.map((b) => b.title).join(', ')}
      >
        <span>🔗 {appState.currentBacklinks.length} {appState.currentBacklinks.length === 1 ? 'backlink' : 'backlinks'}</span>
      </div>
    {/if}
  </div>

  <!-- Right Side: Notepad System Indicators -->
  <div class="flex items-center gap-3 font-medium">
    <!-- Line & Col -->
    <span>Ln {appState.cursorLine}, Col {appState.cursorCol}</span>

    <div class="w-px h-3 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Zoom Control -->
    <div class="flex items-center gap-1.5">
      <button onclick={zoomOut} class="hover:text-[var(--text-primary)] transition-colors cursor-pointer p-0.5 rounded" title="Zoom Out (Ctrl+-)">
        <Minus size={11} />
      </button>
      <button onclick={resetZoom} class="hover:underline cursor-pointer" title="Reset Zoom (Ctrl+0)">
        {appState.zoomLevel}%
      </button>
      <button onclick={zoomIn} class="hover:text-[var(--text-primary)] transition-colors cursor-pointer p-0.5 rounded" title="Zoom In (Ctrl+=)">
        <Plus size={11} />
      </button>
    </div>

    <div class="w-px h-3 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Word Wrap -->
    <button
      onclick={() => (appState.wordWrap = !appState.wordWrap)}
      class="hover:underline cursor-pointer"
      title="Toggle Word Wrap"
    >
      Wrap: {appState.wordWrap ? 'On' : 'Off'}
    </button>

    <div class="w-px h-3 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Line Endings & Encoding -->
    <span>Windows (CRLF)</span>
    <span>UTF-8</span>
  </div>
</footer>

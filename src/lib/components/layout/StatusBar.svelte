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
  class="h-8 px-6 flex items-center justify-between border-t text-[11px] select-none shrink-0"
  style="background-color: var(--bg-statusbar); border-color: var(--border-subtle); color: var(--text-tertiary);"
>
  <!-- Left Side: Status & Counts (Image 1 Style) -->
  <div class="flex items-center gap-3.5">
    <!-- Save Indicator -->
    <div class="flex items-center gap-1.5 font-medium">
      {#if appState.saveStatus === 'saving'}
        <Loader2 size={13} class="animate-spin text-amber-500" />
        <span class="text-amber-500">Saving...</span>
      {:else if appState.saveStatus === 'dirty'}
        <span class="w-2 h-2 rounded-full bg-amber-400"></span>
        <span>Unsaved</span>
      {:else}
        <Check size={13} class="text-emerald-500" />
        <span class="text-emerald-500 font-medium">Saved</span>
      {/if}
    </div>

    <div class="w-px h-3.5 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Word Count -->
    <span class="font-medium">{appState.wordCount} {appState.wordCount === 1 ? 'word' : 'words'}</span>

    <!-- Optional Backlink Counter -->
    {#if appState.currentBacklinks.length > 0}
      <div class="w-px h-3.5 opacity-40 shrink-0" style="background-color: var(--border);"></div>
      <div
        class="flex items-center gap-1 font-medium"
        style="color: var(--accent);"
        title={appState.currentBacklinks.map((b) => b.title).join(', ')}
      >
        <span>🔗 {appState.currentBacklinks.length} {appState.currentBacklinks.length === 1 ? 'backlink' : 'backlinks'}</span>
      </div>
    {/if}
  </div>

  <!-- Right Side: Zoom and Layout Indicators -->
  <div class="flex items-center gap-3.5 font-medium">
    <!-- Line & Col -->
    <span>Ln {appState.cursorLine}, Col {appState.cursorCol}</span>

    <div class="w-px h-3.5 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Zoom Control -->
    <div class="flex items-center gap-1.5">
      <button onclick={zoomOut} class="hover:text-[var(--text-primary)] transition-colors cursor-pointer p-0.5 rounded" title="Zoom Out (Ctrl+-)">
        <Minus size={11} />
      </button>
      <button onclick={resetZoom} class="hover:underline cursor-pointer font-medium" title="Reset Zoom (Ctrl+0)">
        {appState.zoomLevel}%
      </button>
      <button onclick={zoomIn} class="hover:text-[var(--text-primary)] transition-colors cursor-pointer p-0.5 rounded" title="Zoom In (Ctrl+=)">
        <Plus size={11} />
      </button>
    </div>

    <div class="w-px h-3.5 opacity-40 shrink-0" style="background-color: var(--border);"></div>

    <!-- Word Wrap -->
    <button
      onclick={() => (appState.wordWrap = !appState.wordWrap)}
      class="hover:underline cursor-pointer"
      title="Toggle Word Wrap"
    >
      Wrap: {appState.wordWrap ? 'On' : 'Off'}
    </button>
  </div>
</footer>

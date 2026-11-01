<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { Search, Replace, ChevronUp, ChevronDown, X } from '@lucide/svelte';

  let findQuery = $state('');
  let replaceQuery = $state('');
  let matchCount = $state(0);
  let currentMatchIndex = $state(0);

  interface Props {
    onFind?: (query: string, forward: boolean) => void;
    onReplace?: (search: string, replace: string) => void;
    onReplaceAll?: (search: string, replace: string) => void;
  }

  let {
    onFind = () => {},
    onReplace = () => {},
    onReplaceAll = () => {},
  }: Props = $props();

  function handleFindNext() {
    if (findQuery) {
      onFind(findQuery, true);
    }
  }

  function handleFindPrev() {
    if (findQuery) {
      onFind(findQuery, false);
    }
  }

  function handleReplace() {
    if (findQuery) {
      onReplace(findQuery, replaceQuery);
    }
  }

  function handleReplaceAll() {
    if (findQuery) {
      onReplaceAll(findQuery, replaceQuery);
    }
  }

  function autoFocus(el: HTMLElement) {
    setTimeout(() => el?.focus(), 10);
  }
</script>

{#if appState.findReplaceOpen}
  <div
    class="px-6 py-2 border-b flex flex-wrap items-center gap-2.5 text-xs select-none shadow-xs"
    style="background-color: var(--bg-toolbar); border-color: var(--border);"
  >
    <!-- Find Group -->
    <div
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-xs"
      style="background-color: var(--bg-input); border-color: var(--border);"
    >
      <Search size={14} style="color: var(--text-tertiary);" />
      <input
        type="text"
        bind:value={findQuery}
        placeholder="Find in note..."
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) handleFindPrev();
            else handleFindNext();
          }
          if (e.key === 'Escape') appState.findReplaceOpen = false;
        }}
        class="bg-transparent outline-none w-32 md:w-48 text-xs"
        style="color: var(--text-primary);"
        use:autoFocus
      />
      <button onclick={handleFindPrev} class="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer" title="Previous match (Shift+Enter)">
        <ChevronUp size={14} />
      </button>
      <button onclick={handleFindNext} class="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer" title="Next match (Enter)">
        <ChevronDown size={14} />
      </button>
    </div>

    <!-- Replace Group -->
    <div
      class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border shadow-xs"
      style="background-color: var(--bg-input); border-color: var(--border);"
    >
      <Replace size={14} style="color: var(--text-tertiary);" />
      <input
        type="text"
        bind:value={replaceQuery}
        placeholder="Replace with..."
        onkeydown={(e) => {
          if (e.key === 'Enter') handleReplace();
          if (e.key === 'Escape') appState.findReplaceOpen = false;
        }}
        class="bg-transparent outline-none w-32 md:w-48 text-xs"
        style="color: var(--text-primary);"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-1.5">
      <button
        onclick={handleReplace}
        class="px-2.5 py-1 rounded-lg border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
      >
        Replace
      </button>
      <button
        onclick={handleReplaceAll}
        class="px-2.5 py-1 rounded-lg border text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
        style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
      >
        Replace All
      </button>
    </div>

    <!-- Close Button -->
    <button
      onclick={() => (appState.findReplaceOpen = false)}
      class="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 ml-auto cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
      title="Close (Esc)"
    >
      <X size={15} />
    </button>
  </div>
{/if}

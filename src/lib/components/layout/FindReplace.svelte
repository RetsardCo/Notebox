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
</script>

{#if appState.findReplaceOpen}
  <div
    class="p-2 border-b flex flex-wrap items-center gap-2 text-xs select-none shadow-sm"
    style="background-color: var(--bg-toolbar); border-color: var(--border);"
  >
    <!-- Find Group -->
    <div
      class="flex items-center gap-1.5 px-2 py-1 rounded border"
      style="background-color: var(--bg-input); border-color: var(--border);"
    >
      <Search size={13} style="color: var(--text-tertiary);" />
      <input
        type="text"
        bind:value={findQuery}
        placeholder="Find..."
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            if (e.shiftKey) handleFindPrev();
            else handleFindNext();
          }
          if (e.key === 'Escape') appState.findReplaceOpen = false;
        }}
        class="bg-transparent outline-none w-32 md:w-44 text-xs"
        style="color: var(--text-primary);"
        autofocus
      />
      <button onclick={handleFindPrev} class="p-0.5 rounded hover:opacity-75" title="Previous match (Shift+Enter)">
        <ChevronUp size={14} />
      </button>
      <button onclick={handleFindNext} class="p-0.5 rounded hover:opacity-75" title="Next match (Enter)">
        <ChevronDown size={14} />
      </button>
    </div>

    <!-- Replace Group -->
    <div
      class="flex items-center gap-1.5 px-2 py-1 rounded border"
      style="background-color: var(--bg-input); border-color: var(--border);"
    >
      <Replace size={13} style="color: var(--text-tertiary);" />
      <input
        type="text"
        bind:value={replaceQuery}
        placeholder="Replace with..."
        onkeydown={(e) => {
          if (e.key === 'Enter') handleReplace();
          if (e.key === 'Escape') appState.findReplaceOpen = false;
        }}
        class="bg-transparent outline-none w-32 md:w-44 text-xs"
        style="color: var(--text-primary);"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center gap-1">
      <button
        onclick={handleReplace}
        class="px-2 py-1 rounded border text-xs font-medium hover:opacity-85 transition cursor-pointer"
        style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
      >
        Replace
      </button>
      <button
        onclick={handleReplaceAll}
        class="px-2 py-1 rounded border text-xs font-medium hover:opacity-85 transition cursor-pointer"
        style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
      >
        Replace All
      </button>
    </div>

    <!-- Close Button -->
    <button
      onclick={() => (appState.findReplaceOpen = false)}
      class="p-1 rounded hover:opacity-75 ml-auto cursor-pointer"
      title="Close (Esc)"
    >
      <X size={14} />
    </button>
  </div>
{/if}

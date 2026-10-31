<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { Plus, X, FileText, FileCode } from '@lucide/svelte';

  function handleTabClick(tabId: string) {
    appState.setActiveTab(tabId);
  }

  function handleTabClose(tabId: string, e: MouseEvent) {
    e.stopPropagation();
    appState.closeTab(tabId);
  }

  function handleAuxClick(tabId: string, e: MouseEvent) {
    // Middle click to close tab
    if (e.button === 1) {
      e.preventDefault();
      appState.closeTab(tabId);
    }
  }
</script>

<div
  class="h-9 flex items-center border-b px-2 gap-1 overflow-x-auto select-none shrink-0"
  style="background-color: var(--bg-tabbar); border-color: var(--border);"
>
  {#each appState.tabs as tab (tab.id)}
    <div
      role="tab"
      tabindex="0"
      aria-selected={appState.activeTabId === tab.id}
      onclick={() => handleTabClick(tab.id)}
      onauxclick={(e) => handleAuxClick(tab.id, e)}
      onkeydown={(e) => {
        if (e.key === 'Enter') handleTabClick(tab.id);
      }}
      class="group relative h-7 px-2.5 rounded-t-md flex items-center gap-1.5 text-xs transition cursor-pointer shrink-0 max-w-[180px] border-t border-l border-r"
      style={appState.activeTabId === tab.id
        ? 'background-color: var(--bg-tab-active); border-color: var(--border); color: var(--text-primary); font-weight: 500;'
        : 'background-color: transparent; border-color: transparent; color: var(--text-secondary); hover:background-color: var(--bg-tab-hover);'}
    >
      <FileText size={13} style="color: {appState.activeTabId === tab.id ? 'var(--accent)' : 'var(--text-tertiary)'};" class="shrink-0" />
      
      <span class="truncate text-[12px]">{tab.title || 'Untitled'}</span>

      {#if tab.is_dirty}
        <span class="w-1.5 h-1.5 rounded-full shrink-0 group-hover:hidden" style="background-color: var(--accent);"></span>
      {/if}

      <button
        onclick={(e) => handleTabClose(tab.id, e)}
        class="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 shrink-0 transition"
        class:hidden={!tab.is_dirty && appState.activeTabId !== tab.id}
        class:group-hover:flex={true}
        title="Close Tab (Ctrl+W)"
      >
        <X size={12} />
      </button>
    </div>
  {/each}

  <!-- Add Tab Button -->
  <button
    onclick={() => appState.createScratchTab()}
    class="p-1 rounded hover:opacity-80 transition cursor-pointer shrink-0"
    style="color: var(--text-secondary);"
    title="New Tab (Ctrl+T)"
  >
    <Plus size={15} />
  </button>
</div>

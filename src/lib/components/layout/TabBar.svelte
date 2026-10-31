<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { Plus, X, FileText, PanelLeft, PanelLeftOpen } from '@lucide/svelte';

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
  class="h-10 flex items-center border-b px-2 gap-1.5 overflow-x-auto select-none shrink-0"
  style="background-color: var(--bg-tabbar); border-color: var(--border);"
>
  <!-- Sidebar Toggle Button (macOS Apple Notes style) -->
  <button
    onclick={() => appState.toggleSidebar()}
    class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
    title={appState.sidebarCollapsed ? 'Show Sidebar (Ctrl+\\)' : 'Hide Sidebar (Ctrl+\\)'}
    aria-label={appState.sidebarCollapsed ? 'Show Sidebar' : 'Hide Sidebar'}
  >
    {#if appState.sidebarCollapsed}
      <PanelLeftOpen size={16} />
    {:else}
      <PanelLeft size={16} />
    {/if}
  </button>

  <div class="w-px h-4 mx-0.5 opacity-50 shrink-0" style="background-color: var(--border);"></div>

  <!-- Tabs List -->
  {#each appState.tabs as tab (tab.id)}
    {@const isActive = appState.activeTabId === tab.id}
    <div
      role="tab"
      tabindex="0"
      aria-selected={isActive}
      onclick={() => handleTabClick(tab.id)}
      onauxclick={(e) => handleAuxClick(tab.id, e)}
      onkeydown={(e) => {
        if (e.key === 'Enter') handleTabClick(tab.id);
      }}
      class="group relative h-7.5 px-3 rounded-lg flex items-center gap-2 text-xs transition-colors cursor-pointer shrink-0 max-w-[200px] min-w-[120px] select-none border {isActive ? '' : 'hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-primary)]'}"
      style={isActive
        ? 'background-color: var(--bg-tab-active); border-color: var(--border); color: var(--text-primary); font-weight: 500;'
        : 'background-color: transparent; border-color: transparent; color: var(--text-secondary);'}
    >
      <FileText
        size={14}
        style="color: {isActive ? 'var(--accent)' : 'var(--text-tertiary)'};"
        class="shrink-0"
      />
      
      <span class="truncate text-[12px] flex-1 text-left">{tab.title || 'Untitled'}</span>

      <!-- Trailing 16x16 slot: FIXED dimensions, never causes layout shift or jitter on hover -->
      <div class="relative w-4 h-4 flex items-center justify-center shrink-0">
        {#if tab.is_dirty}
          <span
            class="w-1.5 h-1.5 rounded-full transition-opacity duration-150 group-hover:opacity-0"
            style="background-color: var(--accent);"
          ></span>
        {/if}

        <button
          onclick={(e) => handleTabClose(tab.id, e)}
          class="absolute inset-0 flex items-center justify-center rounded transition-all duration-150 {isActive ? 'opacity-40 group-hover:opacity-100 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/15' : 'opacity-0 group-hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/15'}"
          title="Close Tab (Ctrl+W)"
          aria-label="Close Tab"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  {/each}

  <!-- Add Tab Button -->
  <button
    onclick={() => appState.createScratchTab()}
    class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
    title="New Tab (Ctrl+T)"
    aria-label="New Tab"
  >
    <Plus size={16} />
  </button>
</div>

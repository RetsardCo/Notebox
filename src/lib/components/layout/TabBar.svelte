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
    if (e.button === 1) {
      e.preventDefault();
      appState.closeTab(tabId);
    }
  }
</script>

<div
  class="h-11 flex items-center border-b px-5 gap-2.5 select-none shrink-0"
  style="background-color: var(--bg-tabbar); border-color: var(--border);"
>
  <!-- Pinned Leading: Sidebar Toggle Button -->
  {#if appState.sidebarCollapsed}
    <button
      onclick={() => appState.toggleSidebar()}
      class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
      title="Show Sidebar (Ctrl+\)"
      aria-label="Show Sidebar"
    >
      <PanelLeftOpen size={16} />
    </button>
    <div class="w-px h-4 mx-0.5 opacity-40 shrink-0" style="background-color: var(--border);"></div>
  {/if}

  <!-- Scrollable Middle: Tabs List -->
  <div class="flex-1 flex items-center gap-2.5 overflow-x-auto min-w-0 py-1 no-scrollbar">
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
        class="group relative h-8 px-4 rounded-xl flex items-center gap-2.5 text-xs transition-all cursor-pointer shrink-0 max-w-[220px] min-w-[140px] select-none border {isActive ? 'shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'}"
        style={isActive
          ? 'background-color: var(--bg-tab-active); border-color: var(--border); color: var(--text-primary); font-weight: 600;'
          : 'background-color: transparent; border-color: transparent; color: var(--text-secondary);'}
      >
        <FileText
          size={14}
          style="color: {isActive ? 'var(--accent)' : 'var(--text-tertiary)'};"
          class="shrink-0"
        />
        
        <span class="truncate text-[12px] flex-1 text-left">{tab.title || 'Untitled'}</span>

        <!-- Trailing slot for dirty indicator / close button -->
        <div class="relative w-4 h-4 flex items-center justify-center shrink-0">
          {#if tab.is_dirty}
            <span
              class="w-2 h-2 rounded-full transition-opacity duration-150 group-hover:opacity-0"
              style="background-color: var(--accent);"
            ></span>
          {/if}

          <button
            onclick={(e) => handleTabClose(tab.id, e)}
            class="absolute inset-0 flex items-center justify-center rounded-md transition-opacity duration-150 {tab.is_dirty ? 'opacity-0' : (isActive ? 'opacity-50' : 'opacity-0')} group-hover:opacity-100 hover:!opacity-100 hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer"
            title="Close Tab (Ctrl+W)"
            aria-label="Close Tab"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Pinned Trailing: Add Tab Button -->
  <button
    onclick={() => appState.createScratchTab()}
    class="w-8 h-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
    title="New Tab (Ctrl+T)"
    aria-label="New Tab"
  >
    <Plus size={16} />
  </button>
</div>

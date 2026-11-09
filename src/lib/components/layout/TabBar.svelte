<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '$lib/stores/appState.svelte';
  import { Plus, X, FileText, ChevronLeft, ChevronRight } from '@lucide/svelte';

  let scrollContainer = $state<HTMLDivElement | null>(null);
  let hasOverflow = $state(false);
  let canScrollLeft = $state(false);
  let canScrollRight = $state(false);

  function checkOverflow() {
    if (!scrollContainer) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainer;
    hasOverflow = scrollWidth > clientWidth + 2;
    canScrollLeft = scrollLeft > 2;
    canScrollRight = scrollLeft + clientWidth < scrollWidth - 2;
  }

  function handleTabClick(tabId: string) {
    appState.setActiveTab(tabId);
  }

  function handleTabClose(tabId: string, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    appState.closeTab(tabId);
    setTimeout(checkOverflow, 50);
  }

  function handleAuxClick(tabId: string, e: MouseEvent) {
    if (e.button === 1) {
      e.preventDefault();
      e.stopPropagation();
      appState.closeTab(tabId);
      setTimeout(checkOverflow, 50);
    }
  }

  function handleWheel(e: WheelEvent) {
    if (!scrollContainer) return;
    // Support horizontal wheel or standard vertical wheel
    const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
    if (delta !== 0) {
      e.preventDefault();
      scrollContainer.scrollLeft += delta;
      checkOverflow();
    }
  }

  function scrollTabs(direction: 'left' | 'right') {
    if (!scrollContainer) return;
    const offset = direction === 'left' ? -200 : 200;
    scrollContainer.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkOverflow, 250);
  }

  // Scroll active tab into view whenever it changes or tabs are loaded
  $effect(() => {
    const activeId = appState.activeTabId;
    const tabCount = appState.tabs.length;
    if (activeId && scrollContainer) {
      setTimeout(() => {
        if (!scrollContainer) return;
        const activeEl = scrollContainer.querySelector(`[data-tab-id="${activeId}"]`) as HTMLElement | null;
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        }
        checkOverflow();
      }, 30);
    }
  });

  onMount(() => {
    checkOverflow();
    const ro = new ResizeObserver(() => checkOverflow());
    if (scrollContainer) ro.observe(scrollContainer);
    return () => ro.disconnect();
  });
</script>

<div
  class="panel-header-bar flex items-center border-b px-2.5 gap-1.5 select-none shrink-0"
  style="background-color: var(--bg-tabbar); border-color: var(--border-subtle);"
>

  <!-- Conditional Left Scroll Chevron (Only rendered when tabs overflow and can scroll left) -->
  {#if hasOverflow && canScrollLeft}
    <button
      onclick={() => scrollTabs('left')}
      class="w-6 h-7 flex items-center justify-center rounded-md transition-all shrink-0 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
      title="Scroll tabs left"
      aria-label="Scroll tabs left"
    >
      <ChevronLeft size={14} />
    </button>
  {/if}

  <!-- Scrollable Middle: Tabs List -->
  <div
    bind:this={scrollContainer}
    onwheel={handleWheel}
    onscroll={checkOverflow}
    class="flex-1 flex items-center gap-1.5 overflow-x-auto min-w-0 py-1 no-scrollbar scroll-smooth"
  >
    {#each appState.tabs as tab (tab.id)}
      {@const isActive = appState.activeTabId === tab.id}
      <div
        role="tab"
        tabindex="0"
        data-tab-id={tab.id}
        aria-selected={isActive}
        onclick={() => handleTabClick(tab.id)}
        onauxclick={(e) => handleAuxClick(tab.id, e)}
        onkeydown={(e) => {
          if (e.key === 'Enter') handleTabClick(tab.id);
        }}
        class="group relative h-7 px-2.5 rounded-lg flex items-center gap-2 text-xs transition-all cursor-pointer shrink-0 max-w-[200px] min-w-[120px] select-none border {isActive ? 'shadow-xs font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5 font-normal'}"
        style={isActive
          ? 'background-color: var(--bg-tab-active); border-color: var(--border-tab-active, var(--border)); color: var(--text-primary);'
          : 'background-color: transparent; border-color: transparent; color: var(--text-secondary);'}
        title={tab.title || 'Untitled'}
      >
        <FileText
          size={13}
          style="color: {isActive ? 'var(--accent)' : 'var(--text-tertiary)'};"
          class="shrink-0"
        />
        
        <span class="truncate text-[11.5px] flex-1 text-left">{tab.title || 'Untitled'}</span>

        <!-- Trailing slot for dirty indicator / close button -->
        <div class="flex items-center gap-1 shrink-0">
          {#if tab.is_dirty}
            <span
              class="w-1.5 h-1.5 rounded-full pointer-events-none shrink-0"
              style="background-color: var(--accent);"
              title="Unsaved changes"
            ></span>
          {/if}

          <button
            onclick={(e) => handleTabClose(tab.id, e)}
            class="w-5 h-5 flex items-center justify-center p-0.5 rounded-md transition-opacity duration-150 {isActive ? 'opacity-70 hover:opacity-100' : 'opacity-0 group-hover:opacity-70 hover:!opacity-100'} hover:bg-black/10 dark:hover:bg-white/15 cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--text-primary)] shrink-0"
            title="Close Tab (Ctrl+W)"
            aria-label="Close Tab"
          >
            <X size={11} />
          </button>
        </div>
      </div>
    {/each}
  </div>

  <!-- Conditional Right Scroll Chevron (Only rendered when tabs overflow and can scroll right) -->
  {#if hasOverflow && canScrollRight}
    <button
      onclick={() => scrollTabs('right')}
      class="w-6 h-7 flex items-center justify-center rounded-md transition-all shrink-0 cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95"
      title="Scroll tabs right"
      aria-label="Scroll tabs right"
    >
      <ChevronRight size={14} />
    </button>
  {/if}

  <div class="w-px h-3.5 mx-0.5 opacity-30 shrink-0" style="background-color: var(--border);"></div>

  <!-- Pinned Trailing: Add Tab Button -->
  <button
    onclick={() => {
      appState.createScratchTab();
      setTimeout(checkOverflow, 50);
    }}
    class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer shrink-0 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10"
    title="New Tab (Ctrl+T)"
    aria-label="New Tab"
  >
    <Plus size={15} />
  </button>
</div>

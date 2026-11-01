<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { isTauri } from '$lib/services/ipc';
  import { PALETTES } from '$lib/types';
  import {
    Settings,
    Palette,
    PanelLeftClose,
    PanelLeftOpen,
    WrapText,
    Columns2,
  } from '@lucide/svelte';

  let showThemePicker = $state(false);

  async function handleClose(e: MouseEvent) {
    e.stopPropagation();
    if (isTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().close();
      } catch (err) {
        console.error('Failed to close window:', err);
      }
    }
  }

  async function handleMinimize(e: MouseEvent) {
    e.stopPropagation();
    if (isTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().minimize();
      } catch (err) {
        console.error('Failed to minimize window:', err);
      }
    }
  }

  async function handleToggleMaximize(e?: MouseEvent) {
    if (e) e.stopPropagation();
    if (isTauri) {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        await getCurrentWindow().toggleMaximize();
      } catch (err) {
        console.error('Failed to toggle maximize window:', err);
      }
    }
  }

  function closeThemePicker() {
    showThemePicker = false;
  }
</script>

<svelte:window onclick={closeThemePicker} />

<!-- Custom macOS-style Frameless Window Header with Draggable Region -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<header
  data-tauri-drag-region
  class="h-10.5 px-3.5 flex items-center justify-between border-b select-none shrink-0 relative z-30 transition-colors"
  style="background-color: var(--bg-titlebar); border-color: var(--border-subtle);"
  role="region"
  aria-label="Window Title Bar"
>
  <!-- Left Side: macOS 3 Interactive Traffic Lights & App Brand -->
  <div class="flex items-center gap-3 h-full">
    <!-- 3 Interactive Dots (macOS style with subtle hover glyphs) -->
    <div class="flex items-center gap-2 group/dots h-full py-1 px-1" data-tauri-drag-region="false">
      <!-- Red: Close -->
      <button
        onclick={handleClose}
        class="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e] flex items-center justify-center cursor-pointer transition-all active:scale-90 relative shadow-2xs hover:brightness-105"
        title="Close"
        aria-label="Close Window"
      >
        <span class="opacity-0 group-hover/dots:opacity-100 text-[8px] font-bold text-[#4a0002] transition-opacity leading-none">✕</span>
      </button>

      <!-- Yellow: Minimize -->
      <button
        onclick={handleMinimize}
        class="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123] flex items-center justify-center cursor-pointer transition-all active:scale-90 relative shadow-2xs hover:brightness-105"
        title="Minimize"
        aria-label="Minimize Window"
      >
        <span class="opacity-0 group-hover/dots:opacity-100 text-[10px] font-bold text-[#563600] transition-opacity leading-none">−</span>
      </button>

      <!-- Green: Maximize / Restore -->
      <button
        onclick={handleToggleMaximize}
        class="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29] flex items-center justify-center cursor-pointer transition-all active:scale-90 relative shadow-2xs hover:brightness-105"
        title="Maximize / Restore"
        aria-label="Maximize Window"
      >
        <span class="opacity-0 group-hover/dots:opacity-100 text-[9px] font-bold text-[#08480e] transition-opacity leading-none">+</span>
      </button>
    </div>

    <!-- Divider -->
    <div class="w-px h-3.5 opacity-30 shrink-0 pointer-events-none" style="background-color: var(--border);"></div>

    <!-- Brand Label -->
    <div class="flex items-center gap-2 pointer-events-none">
      <img
        src="/notebox-icon.png"
        class="w-4.5 h-4.5 rounded-md object-contain shadow-2xs"
        alt="Notebox"
      />
      <span class="text-xs font-semibold tracking-tight" style="color: var(--text-primary);">
        Notebox
      </span>
    </div>
  </div>

  <!-- Center Area: Active Note Title / Breadcrumb (Draggable) -->
  <div class="flex-1 flex items-center justify-center px-4 overflow-hidden pointer-events-none">
    {#if appState.activeTab}
      <span class="text-xs font-medium truncate max-w-sm" style="color: var(--text-tertiary);">
        {appState.activeTab.title || 'Untitled Note'}
      </span>
    {/if}
  </div>

  <!-- Right Side: Clean Functional Controls (Theme, View Options, Settings) -->
  <div class="flex items-center gap-1.5" data-tauri-drag-region="false">
    <!-- View Option: Toggle Sidebar -->
    <button
      onclick={() => appState.toggleSidebar()}
      class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Toggle Sidebar (Ctrl+\)"
      aria-label="Toggle Sidebar"
    >
      {#if appState.sidebarCollapsed}
        <PanelLeftOpen size={15} />
      {:else}
        <PanelLeftClose size={15} />
      {/if}
    </button>

    <!-- View Option: Toggle Note List Column -->
    <button
      onclick={() => {
        appState.noteListCollapsed = !appState.noteListCollapsed;
        appState.scheduleSessionSave();
      }}
      class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title={appState.noteListCollapsed ? 'Show Notes Column' : 'Hide Notes Column'}
      aria-label="Toggle Notes Column"
    >
      <Columns2 size={15} class={appState.noteListCollapsed ? 'opacity-40' : ''} />
    </button>

    <!-- View Option: Toggle Word Wrap -->
    <button
      onclick={() => {
        appState.wordWrap = !appState.wordWrap;
        appState.scheduleSessionSave();
      }}
      class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Toggle Word Wrap"
      aria-label="Toggle Word Wrap"
    >
      <WrapText size={15} class={appState.wordWrap ? '' : 'opacity-40'} />
    </button>

    <!-- Theme / Palette Quick Switcher Dropdown Button -->
    <div class="relative">
      <button
        onclick={(e) => {
          e.stopPropagation();
          showThemePicker = !showThemePicker;
        }}
        class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        title="Personalization: Color Palette Library"
        aria-label="Color Palette Switcher"
      >
        <span
          class="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
          style="background-color: var(--accent); border-color: rgba(0,0,0,0.2);"
        ></span>
        <Palette size={14} />
      </button>

      <!-- Palette Dropdown Popover (Exact 6 curated themes from Image 1) -->
      {#if showThemePicker}
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
          class="absolute top-full right-0 mt-2 w-60 rounded-2xl border shadow-xl p-2 z-50 backdrop-blur-md"
          style="background-color: var(--bg-modal); border-color: var(--border);"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => { if (e.key === 'Escape') showThemePicker = false; }}
          role="dialog"
          tabindex="-1"
          aria-label="Color Palette Library"
        >
          <div
            class="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider border-b mb-1 flex items-center justify-between"
            style="color: var(--text-tertiary); border-color: var(--border-subtle);"
          >
            <span>Color Palette Library</span>
            <span class="text-[10px] font-normal lowercase opacity-75">6 themes</span>
          </div>

          <div class="space-y-1">
            {#each PALETTES as pal}
              {@const isCurrent = appState.theme === pal.id}
              <button
                onclick={() => {
                  appState.setTheme(pal.id);
                  showThemePicker = false;
                }}
                class="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-medium cursor-pointer transition-all {isCurrent ? 'shadow-xs' : 'hover:bg-black/5 dark:hover:bg-white/5'}"
                style={isCurrent
                  ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
                  : 'color: var(--text-primary);'}
              >
                <div class="flex items-center gap-2">
                  <span
                    class="w-3.5 h-3.5 rounded-full border shrink-0"
                    style="background-color: {pal.accent}; border-color: rgba(0,0,0,0.15);"
                  ></span>
                  <div class="text-left">
                    <div class="font-medium leading-tight">{pal.name}</div>
                    <div class="text-[10px] opacity-60 capitalize">{pal.type} theme</div>
                  </div>
                </div>

                <!-- 5 dots preview from Image 1 -->
                <div class="flex items-center gap-0.5">
                  {#each pal.dots as dot}
                    <span
                      class="w-1.5 h-1.5 rounded-full border border-black/10"
                      style="background-color: {dot};"
                    ></span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Settings Shortcut Button -->
    <button
      onclick={() => (appState.settingsOpen = true)}
      class="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
      title="Settings"
      aria-label="Settings"
    >
      <Settings size={15} />
    </button>
  </div>
</header>

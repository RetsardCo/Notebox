<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { PALETTES } from '$lib/types';
  import {
    X,
    Folder,
    Keyboard,
    Info,
    Check,
    Palette,
    SlidersHorizontal,
    Type,
    HardDrive,
    Copy,
    Search,
    FileText,
  } from '@lucide/svelte';

  type SettingsCategory = 'general' | 'appearance' | 'editor' | 'storage' | 'shortcuts' | 'about';

  let activeCategory = $state<SettingsCategory>('general');
  let shortcutSearch = $state('');
  let copiedVault = $state(false);
  let density = $state<'comfortable' | 'compact' | 'spacious'>('comfortable');

  const categories: { id: SettingsCategory; label: string; icon: any }[] = [
    { id: 'general', label: 'General', icon: SlidersHorizontal },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'editor', label: 'Editor', icon: Type },
    { id: 'storage', label: 'Storage', icon: HardDrive },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
    { id: 'about', label: 'About', icon: Info },
  ];

  interface ShortcutItem {
    group: string;
    key: string;
    desc: string;
  }

  const allShortcuts: ShortcutItem[] = [
    // Navigation
    { group: 'Navigation', key: 'Ctrl + N', desc: 'Create New Note' },
    { group: 'Navigation', key: 'Ctrl + T', desc: 'New Scratch Tab' },
    { group: 'Navigation', key: 'Ctrl + W', desc: 'Close Active Tab' },
    { group: 'Navigation', key: 'Ctrl + S', desc: 'Force Save Note' },
    { group: 'Navigation', key: 'Ctrl + \\', desc: 'Toggle Sidebar' },
    { group: 'Navigation', key: 'Ctrl + Tab', desc: 'Next Tab' },
    { group: 'Navigation', key: 'Ctrl + Shift + Tab', desc: 'Previous Tab' },
    // Search
    { group: 'Search', key: 'Ctrl + F', desc: 'Find in Note' },
    { group: 'Search', key: 'Ctrl + K', desc: 'Quick Focus Search' },
    { group: 'Search', key: 'Ctrl + H', desc: 'Find & Replace' },
    // Formatting
    { group: 'Formatting', key: 'Ctrl + B', desc: 'Bold' },
    { group: 'Formatting', key: 'Ctrl + I', desc: 'Italic' },
    { group: 'Formatting', key: 'Ctrl + U', desc: 'Underline' },
    { group: 'Formatting', key: 'Ctrl + 1 / 2 / 3', desc: 'Heading 1 / 2 / 3' },
    { group: 'Formatting', key: 'Ctrl + Shift + C', desc: 'Insert Checklist' },
    { group: 'Formatting', key: 'Ctrl + Shift + K', desc: 'Insert Code Block' },
    { group: 'Formatting', key: 'Ctrl + Shift + T', desc: 'Insert Table' },
    { group: 'Formatting', key: 'Ctrl + Shift + I', desc: 'Insert Image' },
    // View & App
    { group: 'View & App', key: 'Ctrl + Shift + D', desc: 'Next Theme Palette' },
    { group: 'View & App', key: 'Ctrl + + / -', desc: 'Zoom In / Out' },
    { group: 'View & App', key: 'Ctrl + 0', desc: 'Reset Zoom' },
  ];

  const filteredShortcuts = $derived(
    shortcutSearch.trim() === ''
      ? allShortcuts
      : allShortcuts.filter(
          (s) =>
            s.desc.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
            s.key.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
            s.group.toLowerCase().includes(shortcutSearch.toLowerCase()),
        ),
  );

  let modalRef = $state<HTMLElement | null>(null);

  function copyVaultPath() {
    if (appState.vaultPath) {
      navigator.clipboard.writeText(appState.vaultPath).then(() => {
        copiedVault = true;
        setTimeout(() => (copiedVault = false), 2000);
      }).catch(() => {});
    }
  }

  function handleModalKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      appState.settingsOpen = false;
      return;
    }
    if (e.key === 'Tab' && modalRef) {
      const focusable = modalRef.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  $effect(() => {
    if (appState.settingsOpen) {
      setTimeout(() => {
        if (modalRef) {
          const firstFocusable = modalRef.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled])'
          );
          firstFocusable?.focus();
        }
      }, 40);
    }
  });
</script>

{#if appState.settingsOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
    onclick={() => (appState.settingsOpen = false)}
    onkeydown={handleModalKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-labelledby="settings-modal-title"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={modalRef}
      class="w-full max-w-4xl rounded-[16px] border shadow-2xl overflow-hidden flex flex-col h-[580px] max-h-[88vh]"
      style="background-color: var(--bg-modal); border-color: var(--border);"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="px-6 py-3.5 flex items-center justify-between border-b shrink-0" style="border-color: var(--border-subtle);">
        <div class="flex items-center gap-2.5">
          <img src="/notebox-icon.png" class="w-5 h-5 rounded-md object-contain shadow-xs" alt="Notebox" />
          <h2 id="settings-modal-title" class="font-semibold text-sm tracking-tight" style="color: var(--text-primary);">
            Notebox Settings & Preferences
          </h2>
        </div>
        <button
          onclick={() => (appState.settingsOpen = false)}
          class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          style="color: var(--text-tertiary);"
          title="Close Settings (Escape)"
          aria-label="Close Settings"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Two-Column Modal Body (Left Navigation Rail + Right Content Pane) -->
      <div class="flex-1 flex min-h-0 overflow-hidden">
        <!-- Left Category Rail -->
        <aside
          class="w-48 shrink-0 border-r p-3 flex flex-col gap-1 overflow-y-auto select-none"
          style="border-color: var(--border-subtle); background-color: var(--bg-sidebar);"
          aria-label="Settings Categories"
        >
          {#each categories as cat}
            {@const isActive = activeCategory === cat.id}
            {@const IconComponent = cat.icon}
            <button
              onclick={() => (activeCategory = cat.id)}
              class="w-full h-9 px-3 rounded-xl flex items-center gap-2.5 text-xs font-medium transition-all cursor-pointer text-left {isActive ? 'shadow-xs font-semibold' : 'hover:bg-black/5 dark:hover:bg-white/5'}"
              style={isActive
                ? 'background-color: var(--bg-sidebar-active); color: var(--accent-text);'
                : 'color: var(--text-primary);'}
              aria-current={isActive ? 'page' : undefined}
            >
              <IconComponent size={15} style="color: {isActive ? 'var(--accent)' : 'var(--text-tertiary)'};" class="shrink-0" />
              <span>{cat.label}</span>
            </button>
          {/each}
        </aside>

        <!-- Right Content Pane -->
        <main class="flex-1 p-6 overflow-y-auto text-xs space-y-6 select-text">
          <!-- 1. GENERAL CATEGORY -->
          {#if activeCategory === 'general'}
            <div class="space-y-5">
              <div>
                <h3 class="text-base font-bold tracking-tight mb-1" style="color: var(--text-primary);">General</h3>
                <p class="text-xs" style="color: var(--text-secondary);">Manage application behavior, startup views, and confirmation dialogs.</p>
              </div>

              <!-- Startup View Selection -->
              <div class="p-4 rounded-xl border space-y-2.5" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <span class="font-semibold text-xs block" style="color: var(--text-primary);">Default Startup View</span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onclick={() => {
                      appState.startupView = 'all';
                      appState.scheduleSessionSave();
                    }}
                    class="py-2 px-3 rounded-lg border text-center transition cursor-pointer font-medium text-xs {appState.startupView === 'all' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={appState.startupView === 'all' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    All Notes
                  </button>
                  <button
                    type="button"
                    onclick={() => {
                      appState.startupView = 'pinned';
                      appState.scheduleSessionSave();
                    }}
                    class="py-2 px-3 rounded-lg border text-center transition cursor-pointer font-medium text-xs {appState.startupView === 'pinned' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={appState.startupView === 'pinned' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    Pinned Notes
                  </button>
                  <button
                    type="button"
                    onclick={() => {
                      appState.startupView = 'last_session';
                      appState.scheduleSessionSave();
                    }}
                    class="py-2 px-3 rounded-lg border text-center transition cursor-pointer font-medium text-xs {appState.startupView === 'last_session' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={appState.startupView === 'last_session' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    Last Session
                  </button>
                </div>
              </div>

              <!-- Safety Prompts -->
              <div class="p-4 rounded-xl border space-y-3" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <span class="font-semibold text-xs block" style="color: var(--text-primary);">Safety & Confirmations</span>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={appState.confirmTagDelete}
                    onchange={() => appState.scheduleSessionSave()}
                    class="rounded accent-[var(--accent)] cursor-pointer"
                  />
                  <span style="color: var(--text-secondary);">Confirm before deleting tags (safeguards note associations)</span>
                </label>
                <label class="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    bind:checked={appState.confirmPermanentDelete}
                    onchange={() => appState.scheduleSessionSave()}
                    class="rounded accent-[var(--accent)] cursor-pointer"
                  />
                  <span style="color: var(--text-secondary);">Confirm before permanently purging deleted notes</span>
                </label>
              </div>

              <!-- Auto-save Status Info -->
              <div class="p-4 rounded-xl border flex items-center justify-between" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <div>
                  <span class="font-semibold text-xs block" style="color: var(--text-primary);">Live Auto-Save</span>
                  <span class="text-[11px]" style="color: var(--text-tertiary);">Changes are debounced and automatically persisted to disk.</span>
                </div>
                <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10">
                  Active (400ms)
                </span>
              </div>
            </div>

          <!-- 2. APPEARANCE CATEGORY (Matching target_settings_layout.png 3-column x 2-row grid) -->
          {:else if activeCategory === 'appearance'}
            <div class="space-y-5">
              <div>
                <h3 class="text-base font-bold tracking-tight mb-1" style="color: var(--text-primary);">Appearance</h3>
                <p class="text-xs" style="color: var(--text-secondary);">Customize the look and feel of Notebox.</p>
              </div>

              <!-- Color Theme Grid -->
              <div>
                <span class="font-semibold text-xs block mb-2.5" style="color: var(--text-primary);">Color theme</span>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {#each PALETTES as pal}
                    {@const isSelected = appState.theme === pal.id}
                    <button
                      onclick={() => appState.setTheme(pal.id)}
                      class="p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between {isSelected ? 'shadow-sm ring-1 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-modal)]' : 'hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}"
                      style={isSelected
                        ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent);'
                        : 'background-color: var(--bg-input); border-color: var(--border-subtle);'}
                    >
                      <div>
                        <div class="flex items-center justify-between gap-1.5 mb-1.5">
                          <div class="flex items-center gap-1.5 min-w-0">
                            <span
                              class="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                              style="background-color: {pal.accent}; border-color: rgba(0,0,0,0.15);"
                            ></span>
                            <span class="font-semibold text-xs truncate" style="color: var(--text-primary);">
                              {pal.name}
                            </span>
                            <span class="text-[9.5px] px-1 py-0.2 rounded font-medium opacity-60 shrink-0" style="background-color: var(--border-subtle); color: var(--text-secondary);">
                              {pal.type}
                            </span>
                          </div>

                          {#if isSelected}
                            <Check size={14} style="color: var(--accent);" class="shrink-0" />
                          {/if}
                        </div>

                        <p class="text-[11px] leading-relaxed mb-3 line-clamp-2" style="color: var(--text-secondary);">
                          {pal.description}
                        </p>
                      </div>

                      <!-- 5 Dots Preview with safe bottom padding -->
                      <div class="flex items-center gap-1.5 pt-2 pb-0.5 border-t" style="border-color: var(--border-subtle);">
                        {#each pal.dots as dot}
                          <span
                            class="w-3 h-3 rounded-full border shadow-2xs"
                            style="background-color: {dot}; border-color: rgba(0,0,0,0.15);"
                            title={dot}
                          ></span>
                        {/each}
                      </div>
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Interface Density (From Target Layout) -->
              <div>
                <span class="font-semibold text-xs block mb-2" style="color: var(--text-primary);">Interface density</span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onclick={() => (density = 'comfortable')}
                    class="py-2.5 px-3 rounded-xl border text-center transition cursor-pointer font-medium text-xs {density === 'comfortable' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={density === 'comfortable' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'background-color: var(--bg-input); border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    Comfortable
                  </button>
                  <button
                    type="button"
                    onclick={() => (density = 'compact')}
                    class="py-2.5 px-3 rounded-xl border text-center transition cursor-pointer font-medium text-xs {density === 'compact' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={density === 'compact' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'background-color: var(--bg-input); border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    Compact
                  </button>
                  <button
                    type="button"
                    onclick={() => (density = 'spacious')}
                    class="py-2.5 px-3 rounded-xl border text-center transition cursor-pointer font-medium text-xs {density === 'spacious' ? 'ring-1 ring-[var(--accent)] font-semibold' : 'opacity-80 hover:opacity-100'}"
                    style={density === 'spacious' ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent); color: var(--accent-text);' : 'background-color: var(--bg-input); border-color: var(--border-subtle); color: var(--text-secondary);'}
                  >
                    Spacious
                  </button>
                </div>
              </div>
            </div>

          <!-- 3. EDITOR CATEGORY -->
          {:else if activeCategory === 'editor'}
            <div class="space-y-5">
              <div>
                <h3 class="text-base font-bold tracking-tight mb-1" style="color: var(--text-primary);">Editor</h3>
                <p class="text-xs" style="color: var(--text-secondary);">Configure writing fonts, sizes, line wrapping, and document spacing.</p>
              </div>

              <!-- Font Size -->
              <div class="p-4 rounded-xl border space-y-3" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="font-semibold text-xs block" style="color: var(--text-primary);">Editor Font Size</span>
                    <span class="text-[11px]" style="color: var(--text-tertiary);">Adjust text scaling inside document content.</span>
                  </div>
                  <span class="font-mono text-xs font-semibold px-2 py-0.5 rounded-md border" style="background-color: var(--bg-modal); border-color: var(--border); color: var(--text-primary);">
                    {appState.fontSize}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  bind:value={appState.fontSize}
                  onchange={() => appState.scheduleSessionSave()}
                  class="w-full accent-[var(--accent)] cursor-pointer"
                />
                <div class="flex items-center gap-2 pt-1">
                  {#each [13, 15, 17, 19, 21] as sizePreset}
                    <button
                      type="button"
                      onclick={() => {
                        appState.fontSize = sizePreset;
                        appState.scheduleSessionSave();
                      }}
                      class="px-2.5 py-1 rounded-lg border text-[11px] font-medium transition cursor-pointer {appState.fontSize === sizePreset ? 'bg-[var(--accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'}"
                      style={appState.fontSize === sizePreset ? '' : 'border-color: var(--border-subtle); color: var(--text-secondary);'}
                    >
                      {sizePreset}px
                    </button>
                  {/each}
                </div>
              </div>

              <!-- Word Wrap -->
              <div class="p-4 rounded-xl border flex items-center justify-between" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <div>
                  <span class="font-semibold text-xs block" style="color: var(--text-primary);">Word Wrap</span>
                  <span class="text-[11px]" style="color: var(--text-tertiary);">Soft-wrap lines to fit within editor panel width.</span>
                </div>
                <button
                  type="button"
                  onclick={() => {
                    appState.wordWrap = !appState.wordWrap;
                    appState.scheduleSessionSave();
                  }}
                  class="px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer {appState.wordWrap ? 'bg-[var(--accent)] text-white border-transparent' : 'border-[var(--border)] text-[var(--text-secondary)]'}"
                >
                  {appState.wordWrap ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              <!-- Live Editor Typography Preview -->
              <div class="p-4 rounded-xl border space-y-1.5" style="border-color: var(--border-subtle); background-color: var(--bg-modal);">
                <span class="text-[10px] font-semibold uppercase tracking-wider block" style="color: var(--text-tertiary);">Live Preview</span>
                <p style="font-size: {appState.fontSize}px; line-height: 1.65; color: var(--text-primary);">
                  The quick brown fox jumps over the lazy dog. Markdown notes stay simple, portable, and calm.
                </p>
              </div>
            </div>

          <!-- 4. STORAGE CATEGORY -->
          {:else if activeCategory === 'storage'}
            <div class="space-y-5">
              <div>
                <h3 class="text-base font-bold tracking-tight mb-1" style="color: var(--text-primary);">Storage & Vault</h3>
                <p class="text-xs" style="color: var(--text-secondary);">Local filesystem storage location and database status.</p>
              </div>

              <!-- Vault Location Card -->
              <div class="p-4 rounded-xl border space-y-2.5" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <div class="flex items-center justify-between">
                  <div class="font-semibold flex items-center gap-1.5 text-xs" style="color: var(--text-primary);">
                    <Folder size={14} style="color: var(--accent);" />
                    <span>Local Vault Directory</span>
                  </div>
                  <button
                    onclick={copyVaultPath}
                    class="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                    style="border-color: var(--border-subtle); color: var(--text-secondary);"
                    title="Copy Vault Path"
                  >
                    <Copy size={12} />
                    <span>{copiedVault ? 'Copied!' : 'Copy Path'}</span>
                  </button>
                </div>
                <div
                  class="px-3.5 py-2.5 rounded-xl border text-xs font-mono break-all select-all shadow-xs"
                  style="background-color: var(--bg-modal); border-color: var(--border); color: var(--text-primary);"
                >
                  {appState.vaultPath || 'C:\\Users\\Kurados\\Documents\\Notebox'}
                </div>
              </div>

              <!-- Storage Format Info Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3.5 rounded-xl border space-y-1.5" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                  <div class="flex items-center gap-1.5 font-semibold text-xs" style="color: var(--text-primary);">
                    <FileText size={14} style="color: var(--accent);" />
                    <span>Plain Markdown (.md)</span>
                  </div>
                  <p class="text-[11px] leading-relaxed" style="color: var(--text-secondary);">
                    Notes are saved as human-readable standard Markdown files directly on your local filesystem without vendor lock-in.
                  </p>
                </div>

                <div class="p-3.5 rounded-xl border space-y-1.5" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                  <div class="flex items-center gap-1.5 font-semibold text-xs" style="color: var(--text-primary);">
                    <HardDrive size={14} style="color: var(--accent);" />
                    <span>SQLite 3 Index</span>
                  </div>
                  <p class="text-[11px] leading-relaxed" style="color: var(--text-secondary);">
                    Indexes, tag relations, and full-text search (FTS5) are backed by <code class="font-mono text-[10px]">.notebox/notebox.db</code> with WAL mode.
                  </p>
                </div>
              </div>
            </div>

          <!-- 5. SHORTCUTS CATEGORY -->
          {:else if activeCategory === 'shortcuts'}
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-base font-bold tracking-tight mb-1" style="color: var(--text-primary);">Shortcuts</h3>
                  <p class="text-xs" style="color: var(--text-secondary);">Complete list of registered keyboard shortcuts.</p>
                </div>
                <!-- Search input -->
                <div class="flex items-center px-2.5 py-1 rounded-xl border w-44" style="background-color: var(--bg-input); border-color: var(--border);">
                  <Search size={13} style="color: var(--text-tertiary);" class="mr-1.5 shrink-0" />
                  <input
                    type="text"
                    bind:value={shortcutSearch}
                    placeholder="Search shortcuts..."
                    class="w-full text-xs bg-transparent border-none outline-none font-medium"
                    style="color: var(--text-primary);"
                  />
                </div>
              </div>

              <!-- Shortcut Grid Grouped by Category -->
              <div class="space-y-4">
                {#each ['Navigation', 'Search', 'Formatting', 'View & App'] as groupName}
                  {@const groupShortcuts = filteredShortcuts.filter((s) => s.group === groupName)}
                  {#if groupShortcuts.length > 0}
                    <div>
                      <span class="text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-1" style="color: var(--text-tertiary);">
                        {groupName}
                      </span>
                      <div class="border rounded-xl divide-y overflow-hidden" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                        {#each groupShortcuts as sc}
                          <div class="flex items-center justify-between px-3.5 py-2 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition">
                            <span class="font-medium" style="color: var(--text-primary);">{sc.desc}</span>
                            <kbd class="px-2 py-0.5 rounded-lg font-mono border text-[11px] font-semibold shrink-0" style="background-color: var(--bg-modal); border-color: var(--border); color: var(--text-secondary);">
                              {sc.key}
                            </kbd>
                          </div>
                        {/each}
                      </div>
                    </div>
                  {/if}
                {/each}
                {#if filteredShortcuts.length === 0}
                  <div class="border rounded-xl p-6 text-center text-xs" style="border-color: var(--border-subtle); color: var(--text-tertiary);">
                    No shortcuts matching "{shortcutSearch}"
                  </div>
                {/if}
              </div>
            </div>

          <!-- 6. ABOUT CATEGORY -->
          {:else if activeCategory === 'about'}
            <div class="space-y-5">
              <!-- Banner Card -->
              <div class="p-6 rounded-2xl border text-center flex flex-col items-center justify-center space-y-3" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <img src="/notebox-icon.png" class="w-14 h-14 rounded-2xl object-contain shadow-md" alt="Notebox" />
                <div>
                  <h3 class="text-lg font-bold tracking-tight" style="color: var(--text-primary);">Notebox Desktop</h3>
                  <span class="text-xs font-mono font-medium px-2 py-0.5 rounded-full" style="background-color: var(--accent-light); color: var(--accent-text);">
                    v0.1.0 (Production)
                  </span>
                </div>
                <p class="text-xs max-w-md leading-relaxed" style="color: var(--text-secondary);">
                  A calm, precise, distraction-free desktop writing and note-taking tool built with Svelte 5 runes, TypeScript, Tailwind CSS v4, and Tauri v2.
                </p>
              </div>

              <!-- Tech Specs -->
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="p-3.5 rounded-xl border space-y-1" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                  <span class="font-semibold block text-[11px] uppercase tracking-wider opacity-60" style="color: var(--text-tertiary);">Frontend Stack</span>
                  <p class="font-medium" style="color: var(--text-primary);">Svelte 5 + TypeScript + Vite + Tailwind v4</p>
                </div>
                <div class="p-3.5 rounded-xl border space-y-1" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                  <span class="font-semibold block text-[11px] uppercase tracking-wider opacity-60" style="color: var(--text-tertiary);">Desktop Native</span>
                  <p class="font-medium" style="color: var(--text-primary);">Tauri v2 + Rust + SQLite 3 WAL</p>
                </div>
              </div>

              <!-- External Links (GitHub, License, Docs) -->
              <div class="p-4 rounded-xl border flex items-center justify-between text-xs" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
                <span class="font-semibold" style="color: var(--text-primary);">Open Source & License</span>
                <div class="flex items-center gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    class="font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    style="color: var(--accent);"
                  >
                    GitHub Repository
                  </a>
                  <span style="color: var(--border);">•</span>
                  <a
                    href="https://opensource.org/licenses/MIT"
                    target="_blank"
                    rel="noreferrer"
                    class="font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    style="color: var(--accent);"
                  >
                    MIT License
                  </a>
                </div>
              </div>
            </div>
          {/if}
        </main>
      </div>
    </div>
  </div>
{/if}

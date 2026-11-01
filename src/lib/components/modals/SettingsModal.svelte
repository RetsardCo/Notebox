<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { PALETTES } from '$lib/types';
  import { X, Folder, Keyboard, Info, Check } from '@lucide/svelte';

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'Create New Note' },
    { key: 'Ctrl + T', desc: 'New Scratch Tab' },
    { key: 'Ctrl + W', desc: 'Close Active Tab' },
    { key: 'Ctrl + S', desc: 'Force Save' },
    { key: 'Ctrl + F', desc: 'Search Notes' },
    { key: 'Ctrl + H', desc: 'Find & Replace' },
    { key: 'Ctrl + B', desc: 'Bold' },
    { key: 'Ctrl + I', desc: 'Italic' },
    { key: 'Ctrl + U', desc: 'Underline' },
    { key: 'Ctrl + \\', desc: 'Toggle Sidebar' },
    { key: 'Ctrl + Shift + D', desc: 'Next Theme Palette' },
    { key: 'Ctrl + Tab', desc: 'Next Tab' },
    { key: 'Ctrl + Shift + Tab', desc: 'Previous Tab' },
    { key: 'Ctrl + + / -', desc: 'Zoom In / Out' },
    { key: 'Ctrl + 0', desc: 'Reset Zoom' },
  ];
</script>

{#if appState.settingsOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
    onclick={() => (appState.settingsOpen = false)}
    onkeydown={(e) => {
      if (e.key === 'Escape') appState.settingsOpen = false;
    }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
    aria-labelledby="settings-modal-title"
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="w-full max-w-xl rounded-[16px] border shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
      style="background-color: var(--bg-modal); border-color: var(--border);"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 flex items-center justify-between border-b" style="border-color: var(--border-subtle);">
        <div class="flex items-center gap-2.5">
          <img src="/notebox-icon.png" class="w-6 h-6 rounded-lg object-contain shadow-xs" alt="Notebox" />
          <h2 id="settings-modal-title" class="font-semibold text-sm" style="color: var(--text-primary);">
            Notebox Settings & Preferences
          </h2>
        </div>
        <button
          onclick={() => (appState.settingsOpen = false)}
          class="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
          style="color: var(--text-tertiary);"
          title="Close Settings"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Modal Body with Generous Breathing Room -->
      <div class="p-6 overflow-y-auto space-y-6 text-xs">
        <!-- Personalization / Color Palette Library (Image 1 Style) -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-xs tracking-tight" style="color: var(--text-primary);">
              Personalization & Color Palettes
            </span>
            <span class="text-[11px] opacity-60" style="color: var(--text-secondary);">
              6 distinct curated themes
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {#each PALETTES as pal}
              {@const isSelected = appState.theme === pal.id}
              <button
                onclick={() => appState.setTheme(pal.id)}
                class="p-3 rounded-xl border text-left cursor-pointer transition-all duration-150 flex flex-col justify-between {isSelected ? 'shadow-sm ring-1 ring-[var(--accent)] ring-offset-1 ring-offset-[var(--bg-modal)]' : 'hover:border-[var(--border)] hover:bg-black/5 dark:hover:bg-white/5'}"
                style={isSelected
                  ? 'background-color: var(--bg-sidebar-active); border-color: var(--accent);'
                  : 'background-color: var(--bg-input); border-color: var(--border-subtle);'}
              >
                <!-- Title & Dots Row -->
                <div class="flex items-center justify-between gap-2 mb-1.5">
                  <div class="flex items-center gap-2">
                    <span
                      class="w-3.5 h-3.5 rounded-full border shadow-2xs shrink-0"
                      style="background-color: {pal.accent}; border-color: rgba(0,0,0,0.15);"
                    ></span>
                    <span class="font-semibold text-xs" style="color: var(--text-primary);">
                      {pal.name}
                    </span>
                    <span class="text-[10px] px-1.5 py-0.2 rounded font-medium opacity-60" style="background-color: var(--border-subtle); color: var(--text-secondary);">
                      {pal.type}
                    </span>
                  </div>

                  {#if isSelected}
                    <Check size={14} style="color: var(--accent);" />
                  {/if}
                </div>

                <!-- Palette Description -->
                <p class="text-[11px] leading-relaxed mb-2.5" style="color: var(--text-secondary);">
                  {pal.description}
                </p>

                <!-- Color Swatch Dots Preview (Image 1 Color Palette Library) -->
                <div class="flex items-center gap-1.5 pt-1 border-t" style="border-color: var(--border-subtle);">
                  {#each pal.dots as dot}
                    <span
                      class="w-3.5 h-3.5 rounded-full border shadow-2xs"
                      style="background-color: {dot}; border-color: rgba(0,0,0,0.15);"
                      title={dot}
                    ></span>
                  {/each}
                </div>
              </button>
            {/each}
          </div>
        </div>

        <!-- Vault Section -->
        <div class="space-y-2 pt-2 border-t" style="border-color: var(--border-subtle);">
          <div class="font-semibold flex items-center gap-1.5 text-xs" style="color: var(--text-primary);">
            <Folder size={14} style="color: var(--accent);" />
            <span>Local Vault Location</span>
          </div>
          <div
            class="px-3.5 py-2.5 rounded-xl border text-xs font-mono break-all select-text shadow-xs"
            style="background-color: var(--bg-input); border-color: var(--border); color: var(--text-secondary);"
          >
            {appState.vaultPath}
          </div>
          <p class="text-[11px] leading-relaxed" style="color: var(--text-tertiary);">
            All notes are stored as plain Markdown (.md) files. SQLite database is automatically migrated to notebox.db.
          </p>
        </div>

        <!-- Editor Font Size -->
        <div class="space-y-2 pt-2 border-t" style="border-color: var(--border-subtle);">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-xs" style="color: var(--text-primary);">Editor Font Size</span>
            <span class="font-mono text-xs" style="color: var(--text-secondary);">{appState.fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="24"
            bind:value={appState.fontSize}
            onchange={() => appState.scheduleSessionSave()}
            class="w-full accent-[var(--accent)] cursor-pointer"
          />
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="space-y-2.5 pt-2 border-t" style="border-color: var(--border-subtle);">
          <div class="font-semibold flex items-center gap-1.5 text-xs" style="color: var(--text-primary);">
            <Keyboard size={14} style="color: var(--accent);" />
            <span>Keyboard Shortcuts</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 border rounded-xl p-3" style="border-color: var(--border-subtle); background-color: var(--bg-input);">
            {#each shortcuts as sc}
              <div class="flex items-center justify-between text-[11px] py-0.5">
                <span style="color: var(--text-secondary);">{sc.desc}</span>
                <kbd class="px-2 py-0.5 rounded-lg font-mono border text-[10px]" style="background-color: var(--bg-toolbar); border-color: var(--border);">
                  {sc.key}
                </kbd>
              </div>
            {/each}
          </div>
        </div>

        <!-- About Section -->
        <div class="pt-3 border-t flex items-center justify-between text-[11px]" style="border-color: var(--border-subtle); color: var(--text-tertiary);">
          <div class="flex items-center gap-1.5">
            <Info size={13} />
            <span>Notebox Desktop v0.1.0</span>
          </div>
          <span>Your notes, ideas, and knowledge in one place.</span>
        </div>
      </div>
    </div>
  </div>
{/if}

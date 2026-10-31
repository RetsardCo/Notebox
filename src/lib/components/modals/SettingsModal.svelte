<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { X, Folder, Moon, Sun, Laptop, Keyboard, Info } from '@lucide/svelte';

  const shortcuts = [
    { key: 'Ctrl + N', desc: 'Create New Note' },
    { key: 'Ctrl + T', desc: 'New Scratch Tab' },
    { key: 'Ctrl + W', desc: 'Close Active Tab' },
    { key: 'Ctrl + S', desc: 'Force Save' },
    { key: 'Ctrl + F', desc: 'Search Notes' },
    { key: 'Ctrl + H', desc: 'Find & Replace' },
    { key: 'Ctrl + B', desc: 'Bold' },
    { key: 'Ctrl + I', desc: 'Italic' },
    { key: 'Ctrl + Shift + D', desc: 'Toggle Dark Mode' },
    { key: 'Ctrl + Tab', desc: 'Next Tab' },
    { key: 'Ctrl + Shift + Tab', desc: 'Previous Tab' },
    { key: 'Ctrl + + / -', desc: 'Zoom In / Out' },
    { key: 'Ctrl + 0', desc: 'Reset Zoom' },
  ];
</script>

{#if appState.settingsOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none"
    onclick={() => (appState.settingsOpen = false)}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-lg rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      style="background-color: var(--bg-modal); border-color: var(--border);"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="px-5 py-4 flex items-center justify-between border-b" style="border-color: var(--border-subtle);">
        <h2 class="font-semibold text-sm" style="color: var(--text-primary);">Settings & Preferences</h2>
        <button
          onclick={() => (appState.settingsOpen = false)}
          class="p-1 rounded-md hover:opacity-75 transition cursor-pointer"
          style="color: var(--text-tertiary);"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Modal Body -->
      <div class="p-5 overflow-y-auto space-y-5 text-xs">
        <!-- Vault Section -->
        <div class="space-y-1.5">
          <label class="font-semibold flex items-center gap-1.5" style="color: var(--text-primary);">
            <Folder size={14} style="color: var(--accent);" />
            <span>Local Vault Location</span>
          </label>
          <div
            class="px-3 py-2 rounded-lg border text-xs font-mono break-all select-text"
            style="background-color: var(--bg-input); border-color: var(--border); color: var(--text-secondary);"
          >
            {appState.vaultPath}
          </div>
          <p class="text-[11px]" style="color: var(--text-tertiary);">
            All notes are stored as plain Markdown (.md) files here.
          </p>
        </div>

        <!-- Appearance Section -->
        <div class="space-y-2">
          <label class="font-semibold" style="color: var(--text-primary);">Theme</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              onclick={() => appState.applyTheme('light')}
              class="py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer font-medium transition"
              style={appState.theme === 'light'
                ? 'border-color: var(--accent); background-color: var(--accent-light); color: var(--accent-text);'
                : 'border-color: var(--border); color: var(--text-secondary);'}
            >
              <Sun size={14} />
              <span>Light</span>
            </button>

            <button
              onclick={() => appState.applyTheme('dark')}
              class="py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer font-medium transition"
              style={appState.theme === 'dark'
                ? 'border-color: var(--accent); background-color: var(--accent-light); color: var(--accent-text);'
                : 'border-color: var(--border); color: var(--text-secondary);'}
            >
              <Moon size={14} />
              <span>Dark</span>
            </button>

            <button
              onclick={() => appState.applyTheme('system')}
              class="py-2 px-3 rounded-lg border flex items-center justify-center gap-2 cursor-pointer font-medium transition"
              style={appState.theme === 'system'
                ? 'border-color: var(--accent); background-color: var(--accent-light); color: var(--accent-text);'
                : 'border-color: var(--border); color: var(--text-secondary);'}
            >
              <Laptop size={14} />
              <span>System</span>
            </button>
          </div>
        </div>

        <!-- Editor Font Size -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="font-semibold" style="color: var(--text-primary);">Editor Font Size</label>
            <span style="color: var(--text-secondary);">{appState.fontSize}px</span>
          </div>
          <input
            type="range"
            min="12"
            max="24"
            bind:value={appState.fontSize}
            onchange={() => appState.scheduleSessionSave()}
            class="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <!-- Keyboard Shortcuts -->
        <div class="space-y-2">
          <label class="font-semibold flex items-center gap-1.5" style="color: var(--text-primary);">
            <Keyboard size={14} />
            <span>Keyboard Shortcuts</span>
          </label>
          <div class="grid grid-cols-2 gap-2 border rounded-lg p-2.5" style="border-color: var(--border-subtle);">
            {#each shortcuts as sc}
              <div class="flex items-center justify-between text-[11px]">
                <span style="color: var(--text-secondary);">{sc.desc}</span>
                <kbd class="px-1.5 py-0.5 rounded font-mono border" style="background-color: var(--bg-toolbar); border-color: var(--border);">
                  {sc.key}
                </kbd>
              </div>
            {/each}
          </div>
        </div>

        <!-- About Section -->
        <div class="pt-2 border-t flex items-center justify-between text-[11px]" style="border-color: var(--border-subtle); color: var(--text-tertiary);">
          <div class="flex items-center gap-1.5">
            <Info size={13} />
            <span>NoteFlow Desktop v0.1.0</span>
          </div>
          <span>Ultra-lightweight • Local-First</span>
        </div>
      </div>
    </div>
  </div>
{/if}

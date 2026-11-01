<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { noteService } from '$lib/services/ipc';
  import { Lock, Unlock, X, AlertCircle } from '@lucide/svelte';

  let password = $state('');
  let confirmPassword = $state('');
  let errorMessage = $state('');
  let isSubmitting = $state(false);

  function resetForm() {
    password = '';
    confirmPassword = '';
    errorMessage = '';
    isSubmitting = false;
  }

  async function handleLockSubmit() {
    if (!appState.targetNoteForPassword) return;
    if (password.length < 4) {
      errorMessage = 'Password must be at least 4 characters long.';
      return;
    }
    if (password !== confirmPassword) {
      errorMessage = 'Passwords do not match.';
      return;
    }

    isSubmitting = true;
    errorMessage = '';
    try {
      await noteService.lockNote(appState.targetNoteForPassword.id, password);
      await appState.loadNotes();
      appState.passwordModalOpen = false;
      resetForm();
    } catch (e: any) {
      errorMessage = e?.toString() || 'Failed to lock note.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleUnlockSubmit() {
    if (!appState.targetNoteForPassword) return;
    if (!password) {
      errorMessage = 'Please enter password.';
      return;
    }

    isSubmitting = true;
    errorMessage = '';
    try {
      const noteDetail = await noteService.unlockNote(appState.targetNoteForPassword.id, password);
      // Open in tab with decrypted content
      const existing = appState.tabs.find((t) => t.note_id === noteDetail.id);
      if (existing) {
        existing.content = noteDetail.content;
        existing.is_dirty = false;
        appState.activeTabId = existing.id;
      } else {
        appState.tabs.push({
          id: 'tab-' + Date.now(),
          note_id: noteDetail.id,
          title: noteDetail.title,
          content: noteDetail.content,
          is_dirty: false,
          cursor_line: 1,
          cursor_ch: 1,
          scroll_top: 0,
        });
        appState.activeTabId = appState.tabs[appState.tabs.length - 1].id;
      }
      appState.passwordModalOpen = false;
      resetForm();
    } catch (e: any) {
      errorMessage = e?.toString() || 'Incorrect password.';
    } finally {
      isSubmitting = false;
    }
  }

  async function handleRemoveLockSubmit() {
    if (!appState.targetNoteForPassword) return;
    if (!password) {
      errorMessage = 'Please enter password.';
      return;
    }

    isSubmitting = true;
    errorMessage = '';
    try {
      await noteService.removeNoteLock(appState.targetNoteForPassword.id, password);
      await appState.loadNotes();
      const existing = appState.tabs.find((t) => t.note_id === appState.targetNoteForPassword?.id);
      if (existing) {
        const noteDetail = await noteService.readNote(existing.note_id!);
        existing.content = noteDetail.content;
        existing.is_dirty = false;
      }
      appState.passwordModalOpen = false;
      resetForm();
    } catch (e: any) {
      errorMessage = e?.toString() || 'Incorrect password.';
    } finally {
      isSubmitting = false;
    }
  }
</script>

{#if appState.passwordModalOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none"
    onclick={() => {
      appState.passwordModalOpen = false;
      resetForm();
    }}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <div
      class="w-full max-w-sm rounded-2xl border shadow-2xl p-5 space-y-4"
      style="background-color: var(--bg-modal); border-color: var(--border);"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          {#if appState.passwordModalMode === 'lock'}
            <Lock size={16} style="color: var(--accent);" />
            <h3 class="font-semibold text-sm" style="color: var(--text-primary);">Lock Note</h3>
          {:else if appState.passwordModalMode === 'remove_lock'}
            <Unlock size={16} style="color: var(--accent);" />
            <h3 class="font-semibold text-sm" style="color: var(--text-primary);">Remove Password Lock</h3>
          {:else}
            <Unlock size={16} style="color: var(--accent);" />
            <h3 class="font-semibold text-sm" style="color: var(--text-primary);">Unlock Note</h3>
          {/if}
        </div>
        <button
          onclick={() => {
            appState.passwordModalOpen = false;
            resetForm();
          }}
          class="p-1 rounded-lg hover:opacity-75 cursor-pointer"
        >
          <X size={15} style="color: var(--text-tertiary);" />
        </button>
      </div>

      <!-- Description -->
      <p class="text-xs" style="color: var(--text-secondary);">
        {#if appState.passwordModalMode === 'lock'}
          Protect "{appState.targetNoteForPassword?.title || 'this note'}" with AES-256 encryption.
        {:else if appState.passwordModalMode === 'remove_lock'}
          Enter current password to remove encryption lock from "{appState.targetNoteForPassword?.title}".
        {:else}
          Enter password to unlock and view "{appState.targetNoteForPassword?.title}".
        {/if}
      </p>

      <!-- Input Form -->
      <div class="space-y-3">
        <div>
          <label class="text-[11px] font-medium" style="color: var(--text-primary);">Password</label>
          <input
            type="password"
            bind:value={password}
            placeholder="Enter password..."
            onkeydown={(e) => {
              if (e.key === 'Enter') {
                if (appState.passwordModalMode === 'lock') handleLockSubmit();
                else if (appState.passwordModalMode === 'remove_lock') handleRemoveLockSubmit();
                else handleUnlockSubmit();
              }
            }}
            class="w-full px-3 py-2 mt-1 rounded-xl border text-xs outline-none"
            style="background-color: var(--bg-input); border-color: var(--border); color: var(--text-primary);"
            autofocus
          />
        </div>

        {#if appState.passwordModalMode === 'lock'}
          <div>
            <label class="text-[11px] font-medium" style="color: var(--text-primary);">Confirm Password</label>
            <input
              type="password"
              bind:value={confirmPassword}
              placeholder="Confirm password..."
              onkeydown={(e) => {
                if (e.key === 'Enter') handleLockSubmit();
              }}
              class="w-full px-3 py-2 mt-1 rounded-xl border text-xs outline-none"
              style="background-color: var(--bg-input); border-color: var(--border); color: var(--text-primary);"
            />
          </div>
        {/if}

        {#if errorMessage}
          <div class="flex items-center gap-1.5 text-xs text-red-500">
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div class="flex items-center justify-end gap-2 pt-2 border-t" style="border-color: var(--border-subtle);">
        <button
          onclick={() => {
            appState.passwordModalOpen = false;
            resetForm();
          }}
          class="px-3.5 py-1.5 rounded-xl border text-xs font-medium hover:opacity-80 transition cursor-pointer"
          style="border-color: var(--border); color: var(--text-secondary);"
        >
          Cancel
        </button>

        <button
          onclick={() => {
            if (appState.passwordModalMode === 'lock') handleLockSubmit();
            else if (appState.passwordModalMode === 'remove_lock') handleRemoveLockSubmit();
            else handleUnlockSubmit();
          }}
          disabled={isSubmitting}
          class="px-3.5 py-1.5 rounded-xl text-xs font-medium hover:opacity-90 transition cursor-pointer shadow-xs"
          style="background-color: var(--accent); color: #000;"
        >
          {appState.passwordModalMode === 'lock'
            ? 'Lock Note'
            : appState.passwordModalMode === 'remove_lock'
              ? 'Remove Lock'
              : 'Unlock Note'}
        </button>
      </div>
    </div>
  </div>
{/if}

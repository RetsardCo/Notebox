<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { Trash2, AlertCircle, AlertTriangle } from '@lucide/svelte';

  let dialogRef = $state<HTMLDivElement | null>(null);
  let cancelButtonRef = $state<HTMLButtonElement | null>(null);
  let confirmButtonRef = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    if (appState.confirmModalOpen) {
      // Focus safe button (Cancel button for destructive actions, Confirm button otherwise)
      setTimeout(() => {
        if (appState.confirmOptions?.destructive && cancelButtonRef) {
          cancelButtonRef?.focus();
        } else {
          confirmButtonRef?.focus() || cancelButtonRef?.focus();
        }
      }, 50);
    }
  });

  function handleKeydown(e: KeyboardEvent) {
    if (!appState.confirmModalOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      appState.resolveConfirm(false);
      return;
    }

    if (e.key === 'Tab' && dialogRef) {
      const focusable = dialogRef.querySelectorAll<HTMLElement>('button:not([disabled])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      // Pull focus back inside modal if focus drifted outside dialog card
      if (!dialogRef.contains(document.activeElement)) {
        e.preventDefault();
        if (e.shiftKey) {
          last.focus();
        } else {
          first.focus();
        }
        return;
      }

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if appState.confirmModalOpen && appState.confirmOptions}
  {@const opts = appState.confirmOptions}
  {@const isDestructive = opts.destructive ?? true}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
    onclick={() => appState.resolveConfirm(false)}
    tabindex="-1"
  >
    <!-- Modal Card (16px radius, semantic tokens, 24px padding) -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      bind:this={dialogRef}
      role={isDestructive ? 'alertdialog' : 'dialog'}
      aria-modal="true"
      tabindex="-1"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
      class="w-full max-w-md rounded-[16px] border shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150"
      style="background-color: var(--bg-modal); border-color: var(--border); padding: 24px;"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header with Icon Badge & Title -->
      <div class="flex items-center gap-3">
        {#if isDestructive}
          <div class="w-9 h-9 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Trash2 size={18} />
          </div>
        {:else}
          <div class="w-9 h-9 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle size={18} />
          </div>
        {/if}
        <div class="min-w-0 flex-1">
          <h3
            id="confirm-dialog-title"
            class="font-semibold text-sm leading-snug break-words"
            style="color: var(--text-primary);"
          >
            {opts.title || (isDestructive ? 'Confirm Deletion' : 'Confirm Action')}
          </h3>
        </div>
      </div>

      <!-- Message & Detail Description -->
      <div class="space-y-2">
        <p
          id="confirm-dialog-desc"
          class="text-xs leading-relaxed break-words whitespace-pre-line"
          style="color: var(--text-secondary);"
        >
          {opts.message}
        </p>
        {#if opts.detail}
          <p class="text-[11px] leading-relaxed opacity-80 break-words whitespace-pre-line" style="color: var(--text-tertiary);">
            {opts.detail}
          </p>
        {/if}
        {#if isDestructive}
          <div class="flex items-center gap-1.5 text-[11px] font-medium text-red-600 dark:text-red-400 pt-0.5">
            <AlertTriangle size={12} class="shrink-0" />
            <span>This action cannot be undone.</span>
          </div>
        {/if}
      </div>

      <!-- Footer Buttons -->
      <div
        class="flex items-center justify-end gap-2.5 pt-4 border-t mt-1"
        style="border-color: var(--border-subtle);"
      >
        {#if opts.cancelText !== ''}
          <button
            bind:this={cancelButtonRef}
            type="button"
            disabled={appState.isConfirmSubmitting}
            onclick={() => appState.resolveConfirm(false)}
            class="px-4 py-2 rounded-xl text-xs font-medium border transition cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 disabled:opacity-50"
            style="border-color: var(--border-subtle); color: var(--text-secondary);"
          >
            {opts.cancelText || 'Cancel'}
          </button>
        {/if}

        <button
          bind:this={confirmButtonRef}
          type="button"
          disabled={appState.isConfirmSubmitting}
          onclick={() => appState.resolveConfirm(true)}
          class="px-4 py-2 rounded-xl text-xs font-semibold text-white transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 {isDestructive
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-[var(--accent)] hover:brightness-105'}"
        >
          {opts.confirmText || (isDestructive ? 'Delete' : 'Confirm')}
        </button>
      </div>
    </div>
  </div>
{/if}

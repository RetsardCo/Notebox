<script lang="ts">
  import { appState } from '$lib/stores/appState.svelte';
  import { noteService } from '$lib/services/ipc';
  import { FileDown, Printer, FileText, Code, Globe, X } from '@lucide/svelte';

  interface Props {
    open?: boolean;
    onClose?: () => void;
  }

  let { open = false, onClose = () => {} }: Props = $props();

  function downloadFile(content: string, filename: string, mime: string) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  }

  async function exportAsMarkdown() {
    const tab = appState.activeTab;
    if (!tab) return;
    const filename = `${tab.title || 'Note'}.md`;
    downloadFile(tab.content, filename, 'text/markdown');
  }

  async function exportAsText() {
    const tab = appState.activeTab;
    if (!tab) return;
    const plain = tab.content
      .split('\n')
      .map((l) => l.replace(/^#+\s*/, '').trim())
      .join('\n');
    const filename = `${tab.title || 'Note'}.txt`;
    downloadFile(plain, filename, 'text/plain');
  }

  async function exportAsHtml() {
    const tab = appState.activeTab;
    if (!tab) return;
    const { markdownToHtml } = await import('$lib/utils/markdown');
    const bodyHtml = markdownToHtml(tab.content);
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${tab.title || 'Note'}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1a1a1a; }
    h1, h2, h3 { color: #111; }
    table { border-collapse: collapse; width: 100%; margin: 1em 0; }
    th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
    th { background-color: #f5f5f5; }
    code { font-family: monospace; background: #eee; padding: 2px 4px; border-radius: 3px; }
    pre { background: #f8f8f8; border: 1px solid #eee; padding: 12px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
    const filename = `${tab.title || 'Note'}.html`;
    downloadFile(fullHtml, filename, 'text/html');
  }

  function handlePrint() {
    window.print();
    onClose();
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm select-none"
    onclick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      class="w-full max-w-sm rounded-xl border shadow-2xl p-5 space-y-4"
      style="background-color: var(--bg-modal); border-color: var(--border);"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <FileDown size={16} style="color: var(--accent);" />
          <h3 class="font-semibold text-sm" style="color: var(--text-primary);">Share & Export Note</h3>
        </div>
        <button onclick={onClose} class="p-1 rounded hover:opacity-75">
          <X size={15} style="color: var(--text-tertiary);" />
        </button>
      </div>

      <p class="text-xs" style="color: var(--text-secondary);">
        Export "{appState.activeTab?.title || 'Note'}" into your format of choice:
      </p>

      <!-- Options -->
      <div class="space-y-2">
        <button
          onclick={exportAsMarkdown}
          class="w-full p-2.5 rounded-lg border flex items-center gap-3 text-xs font-medium hover:opacity-85 transition cursor-pointer text-left"
          style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
        >
          <Code size={16} style="color: var(--accent);" />
          <div>
            <div class="font-semibold">Markdown (.md)</div>
            <div class="text-[10px]" style="color: var(--text-tertiary);">Original plain text format</div>
          </div>
        </button>

        <button
          onclick={exportAsText}
          class="w-full p-2.5 rounded-lg border flex items-center gap-3 text-xs font-medium hover:opacity-85 transition cursor-pointer text-left"
          style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
        >
          <FileText size={16} style="color: var(--accent);" />
          <div>
            <div class="font-semibold">Plain Text (.txt)</div>
            <div class="text-[10px]" style="color: var(--text-tertiary);">Clean unformatted text</div>
          </div>
        </button>

        <button
          onclick={exportAsHtml}
          class="w-full p-2.5 rounded-lg border flex items-center gap-3 text-xs font-medium hover:opacity-85 transition cursor-pointer text-left"
          style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
        >
          <Globe size={16} style="color: var(--accent);" />
          <div>
            <div class="font-semibold">HTML Document (.html)</div>
            <div class="text-[10px]" style="color: var(--text-tertiary);">Web-styled formatted view</div>
          </div>
        </button>

        <button
          onclick={handlePrint}
          class="w-full p-2.5 rounded-lg border flex items-center gap-3 text-xs font-medium hover:opacity-85 transition cursor-pointer text-left"
          style="background-color: var(--bg-sidebar); border-color: var(--border); color: var(--text-primary);"
        >
          <Printer size={16} style="color: var(--accent);" />
          <div>
            <div class="font-semibold">Print / Save as PDF</div>
            <div class="text-[10px]" style="color: var(--text-tertiary);">Windows system print dialog</div>
          </div>
        </button>
      </div>
    </div>
  </div>
{/if}

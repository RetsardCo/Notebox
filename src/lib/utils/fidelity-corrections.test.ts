// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Phase 2 Visual Fidelity & Functional Alignment Tests', () => {
  const cssFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app.css'), 'utf8');
  const pageFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/routes/+page.svelte'), 'utf8');
  const sidebarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Sidebar.svelte'), 'utf8');
  const noteListFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/NoteList.svelte'), 'utf8');
  const tabBarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/TabBar.svelte'), 'utf8');
  const appStateFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/stores/appState.svelte.ts'), 'utf8');
  const editorFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Editor.svelte'), 'utf8');

  it('CORR-01: Standardized panel header height token and uniform class across all 3 panels', () => {
    // 1. Authoritative CSS token --panel-header-height: 44px in :root
    expect(cssFile).toMatch(/--panel-header-height:\s*44px;/);
    // 2. .panel-header-bar uses var(--panel-header-height
    expect(cssFile).toMatch(/\.panel-header-bar\s*\{[^}]*height:\s*var\(--panel-header-height/);
    // 3. Sidebar header uses panel-header-bar
    expect(sidebarFile).toMatch(/class="[^"]*panel-header-bar[^"]*"/);
    // 4. NoteList header uses panel-header-bar
    expect(noteListFile).toMatch(/class="[^"]*panel-header-bar[^"]*"/);
    // 5. TabBar uses panel-header-bar (eliminating 8px stepped misalignment)
    expect(tabBarFile).toMatch(/class="[^"]*panel-header-bar[^"]*"/);
  });

  it('CORR-02: Tag row note count hides on hover/focus-within to prevent collision with action button', () => {
    // Tag row should hide the note count on hover/focus-within
    expect(sidebarFile).toMatch(/group-hover\/tag:opacity-0/);
    expect(sidebarFile).toMatch(/group-focus-within\/tag:opacity-0/);
    // Tag row should have actions menu button revealed on hover/focus
    expect(sidebarFile).toMatch(/group-hover\/tag:opacity-100/);
    // Tag actions menu provides "Edit tag name"
    expect(sidebarFile).toMatch(/Edit tag name/);
    // Tag actions menu provides "Change color" with quick swatches
    expect(sidebarFile).toMatch(/showColorPickerForTag/);
    // Deleting tag when confirmation is disabled invokes appState.deleteTag
    expect(sidebarFile).toMatch(/await appState\.deleteTag\(tag\.id\)/);
  });

  it('CORR-03: confirmPermanentDelete preference is actually honored in NoteList.svelte', () => {
    // Empty trash checks confirmPermanentDelete
    expect(noteListFile).toMatch(/!appState\.confirmPermanentDelete\s*\|\|\s*confirm/);
    // Card permanent delete checks confirmPermanentDelete
    expect(noteListFile).toMatch(/!appState\.confirmPermanentDelete\s*\|\|\s*confirm\(`Permanently delete/);
  });

  it('CORR-04: startupView is honored in all session restore code paths', () => {
    // Both restored and empty-tabs branches in appState.svelte.ts must evaluate startupView
    const startupViewMatches = appStateFile.match(/this\.startupView === 'pinned'/g);
    expect(startupViewMatches).not.toBeNull();
    expect(startupViewMatches?.length).toBeGreaterThanOrEqual(2);
  });

  it('CORR-05: Splitter drag prevents text selection and sets appropriate pointer styling', () => {
    expect(pageFile).toMatch(/onMouseDownSidebarSplitter\(e:\s*MouseEvent\)\s*\{[^}]*e\.preventDefault\(\)/);
    expect(pageFile).toMatch(/onMouseDownNoteListSplitter\(e:\s*MouseEvent\)\s*\{[^}]*e\.preventDefault\(\)/);
    expect(pageFile).toMatch(/document\.body\.style\.userSelect\s*=\s*'none'/);
  });

  it('CORR-06: Editor resets formatting when no tabs are active', () => {
    expect(editorFile).toMatch(/appState\.resetFormatting\(\)/);
  });

  it('CORR-07: Redundant sidebar toggles removed from NoteList, Sidebar, and TabBar', () => {
    expect(noteListFile).not.toMatch(/toggleSidebar/);
    expect(sidebarFile).not.toMatch(/toggleSidebar/);
    expect(tabBarFile).not.toMatch(/toggleSidebar/);
  });

  it('CORR-08: Splitter drag disables transitions using class:transition-none and CSS rule', () => {
    expect(pageFile).toMatch(/class:transition-none=\{isDraggingSidebar\s*\|\|\s*isDraggingNoteList\}/);
    expect(cssFile).toMatch(/\.transition-none\s*\{\s*transition:\s*none\s*!important;\s*\}/);
  });

  it('CORR-09: Settings modal uses adaptive height and 3-column theme grid', () => {
    const settingsFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/modals/SettingsModal.svelte'), 'utf8');
    expect(settingsFile).toMatch(/min-h-\[460px\]\s+max-h-\[85vh\]\s+h-auto/);
    expect(settingsFile).toMatch(/grid-cols-1\s+sm:grid-cols-3/);
  });

  it('CORR-10: NoteList min width token standardized to 240px', () => {
    expect(cssFile).toMatch(/--notelist-min-width:\s*240px;/);
  });
});

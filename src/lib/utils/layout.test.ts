// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Design System Spacing Hierarchy', () => {
  const cssFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/app.css'), 'utf8');
  const pageFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/routes/+page.svelte'), 'utf8');
  const sidebarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Sidebar.svelte'), 'utf8');
  const noteListFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/NoteList.svelte'), 'utf8');
  const editorFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Editor.svelte'), 'utf8');
  const toolbarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Toolbar.svelte'), 'utf8');
  const statusBarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/StatusBar.svelte'), 'utf8');

  it('R2.1: Unified contiguous 3-panel layout in +page.svelte & app.css without disconnected island gutters', () => {
    // Should have workspace-container class with contiguous connected panels
    expect(pageFile).toMatch(/workspace-container/);
    expect(cssFile).toMatch(/\.workspace-container\s*\{[^}]*display:\s*flex/);
    // Should have sidebar-panel, notelist-panel, and editor-panel connected with splitter
    expect(pageFile).toMatch(/sidebar-panel/);
    expect(pageFile).toMatch(/notelist-panel/);
    expect(pageFile).toMatch(/editor-panel/);
    expect(pageFile).toMatch(/splitter-handle/);
  });

  it('R2.2: Sidebar horizontal padding is standardized to 12px (px-3)', () => {
    // Header, search container, navigation container, footer should have px-3
    expect(sidebarFile).toMatch(/px-3/);
    // Section spacing between 16px and 20px (space-y-4 = 16px)
    expect(sidebarFile).toMatch(/space-y-4/);
  });

  it('R2.3: Notes panel container has padding and card gap in app.css & NoteList.svelte', () => {
    expect(noteListFile).toMatch(/notelist-cards-container/);
    expect(cssFile).toMatch(/\.notelist-cards-container\s*\{[^}]*padding:\s*10px 12px/);
    expect(cssFile).toMatch(/\.notelist-cards-container\s*\{[^}]*gap:\s*8px/);
  });

  it('R2.4: Note card padding is 12px and card radius is 12px in app.css & NoteList.svelte', () => {
    expect(noteListFile).toMatch(/notelist-card-item/);
    expect(cssFile).toMatch(/\.notelist-card-item\s*\{[^}]*padding:\s*12px/);
    expect(cssFile).toMatch(/\.notelist-card-item\s*\{[^}]*border-radius:\s*12px/);
  });

  it('R2.5: Editor toolbar padding is between 12px and 16px (px-3.5 or px-4)', () => {
    expect(toolbarFile).toMatch(/px-(?:3\.5|4)/);
  });

  it('R2.6: Editor content horizontal padding is 32–40px (px-8 to px-10) and top padding is 24–32px (pt-6 to pt-8)', () => {
    expect(editorFile).toMatch(/px-8 sm:px-10/);
    expect(editorFile).toMatch(/pt-7/);
    expect(editorFile).toMatch(/editor-content-container/);
    expect(cssFile).toMatch(/\.editor-content-container\s*\{[^}]*padding-left:\s*36px/);
  });

  it('R2.7: Editor content does not collapse with min-w-max touching left window border', () => {
    // Must NOT have min-w-max on the page wrapper which caused Image 4 zero-margin left alignment
    expect(editorFile).not.toMatch(/min-w-max/);
  });

  it('R2.8: Status bar buttons and text have explicit horizontal padding', () => {
    expect(statusBarFile).toMatch(/px-(?:3\.5|4)/);
  });
});

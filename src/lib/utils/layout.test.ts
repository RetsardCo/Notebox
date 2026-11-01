// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

const PROJECT_ROOT = process.cwd();

describe('Design System Spacing Hierarchy', () => {
  const pageFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/routes/+page.svelte'), 'utf8');
  const sidebarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Sidebar.svelte'), 'utf8');
  const noteListFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/NoteList.svelte'), 'utf8');
  const editorFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Editor.svelte'), 'utf8');
  const toolbarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/Toolbar.svelte'), 'utf8');
  const statusBarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/StatusBar.svelte'), 'utf8');

  it('R2.1: Workspace gutter is 10px and panel-to-panel gutter is 10px in +page.svelte', () => {
    // Should have 10px padding and 10px gap
    expect(pageFile).toMatch(/p-\[10px\]/);
    expect(pageFile).toMatch(/gap-\[10px\]/);
    // Should have rounded panels with subtle border
    expect(pageFile).toMatch(/rounded-\[12px\]/);
  });

  it('R2.2: Sidebar horizontal padding is standardized to 12px (px-3)', () => {
    // Header, search container, navigation container, footer should have px-3
    expect(sidebarFile).toMatch(/px-3/);
    // Section spacing between 16px and 20px (space-y-4 = 16px)
    expect(sidebarFile).toMatch(/space-y-4/);
  });

  it('R2.3: Notes panel padding is 10px (p-2.5) and card gap is 6–8px (space-y-2)', () => {
    expect(noteListFile).toMatch(/p-2\.5/);
    expect(noteListFile).toMatch(/space-y-2/);
  });

  it('R2.4: Note card padding is between 10px and 12px (p-2.5 or p-3)', () => {
    expect(noteListFile).toMatch(/p-3 rounded-xl/);
  });

  it('R2.5: Editor toolbar padding is between 12px and 16px (px-3.5 or px-4)', () => {
    expect(toolbarFile).toMatch(/px-(?:3\.5|4)/);
  });

  it('R2.6: Editor content horizontal padding is 32–40px (px-8 to px-10) and top padding is 24–32px (pt-6 to pt-8)', () => {
    expect(editorFile).toMatch(/px-8 sm:px-10/);
    expect(editorFile).toMatch(/pt-7/);
  });

  it('R2.7: Editor content does not collapse with min-w-max touching left window border', () => {
    // Must NOT have min-w-max on the page wrapper which caused Image 4 zero-margin left alignment
    expect(editorFile).not.toMatch(/min-w-max/);
  });

  it('R2.8: Status bar buttons and text have explicit horizontal padding', () => {
    expect(statusBarFile).toMatch(/px-(?:3\.5|4)/);
  });
});

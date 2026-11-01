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
  const tabBarFile = fs.readFileSync(path.join(PROJECT_ROOT, 'src/lib/components/layout/TabBar.svelte'), 'utf8');

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
    expect(cssFile).toMatch(/\.notelist-cards-container\s*\{[^}]*padding:\s*10px/);
    expect(cssFile).toMatch(/\.notelist-cards-container\s*\{[^}]*gap:\s*8px/);
  });

  it('R2.4: Note card padding is 10px 12px and card radius is 12px in app.css & NoteList.svelte', () => {
    expect(noteListFile).toMatch(/notelist-card-item/);
    expect(cssFile).toMatch(/\.notelist-card-item\s*\{[^}]*padding:\s*10px 12px/);
    expect(cssFile).toMatch(/\.notelist-card-item\s*\{[^}]*border-radius:\s*(?:12px|var\(--radius-card\))/);
  });

  it('R2.5: Editor toolbar padding is standardized (px-3)', () => {
    expect(toolbarFile).toMatch(/px-3/);
  });

  it('R2.6: Editor content horizontal padding is 40px and top padding is 28px with top-left anchor', () => {
    expect(editorFile).toMatch(/editor-content-container/);
    expect(cssFile).toMatch(/\.editor-content-container\s*\{[^}]*padding:\s*28px 40px 48px/);
    expect(cssFile).toMatch(/\.editor-content-container\s*\{[^}]*transform-origin:\s*top left/);
  });

  it('R2.7: Editor content does not collapse with min-w-max touching left window border', () => {
    // Must NOT have min-w-max on the page wrapper which caused Image 4 zero-margin left alignment
    expect(editorFile).not.toMatch(/min-w-max/);
  });

  it('R2.8: Status bar buttons and text have explicit horizontal padding', () => {
    expect(statusBarFile).toMatch(/px-(?:3\.5|4)/);
  });

  it('R2.9: Three-island workspace system and word wrap override rules', () => {
    expect(cssFile).toMatch(/--bg-canvas:\s*#ECE0F8;/);
    expect(cssFile).toMatch(/--panel-radius:\s*16px;/);
    expect(cssFile).toMatch(/\.editor-no-wrap \.ProseMirror/);
  });

  it('R2.10: Active and inactive note card color tokens and hover deletion in NoteList.svelte', () => {
    expect(cssFile).toMatch(/--bg-notelist-card:\s*#FCF8FE;/);
    expect(cssFile).toMatch(/--bg-notelist-active:\s*#F1E8FA;/);
    expect(cssFile).toMatch(/--border-card-active:\s*#9D76F5;/);
    // Verify hover delete action exists and calls deleteNote
    expect(noteListFile).toMatch(/appState\.deleteNote\(note\.id,\s*false\)/);
  });

  it('R2.11: Distinct white floating pill active tab and visible close button in TabBar.svelte', () => {
    expect(cssFile).toMatch(/--bg-tab-active:\s*#FFFFFF;/);
    expect(cssFile).toMatch(/--border-tab-active:\s*#DDD3EE;/);
    expect(tabBarFile).toMatch(/handleTabClose\(tab\.id,\s*e\)/);
    expect(tabBarFile).toMatch(/e\.stopPropagation\(\)/);
  });

  it('R2.12: Keyboard copy (Ctrl+C) handler in +page.svelte and Editor.svelte', () => {
    expect(pageFile).toMatch(/navigator\.clipboard\.writeText/);
    expect(editorFile).toMatch(/navigator\.clipboard\.writeText/);
  });
});

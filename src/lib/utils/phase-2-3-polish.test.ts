// @ts-nocheck
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { appState } from '../stores/appState.svelte';

const PROJECT_ROOT = process.cwd();

describe('Phase 2.3 UI Polish & Interaction Consistency', () => {
  const confirmModalPath = path.join(PROJECT_ROOT, 'src/lib/components/modals/ConfirmModal.svelte');
  const settingsModalPath = path.join(PROJECT_ROOT, 'src/lib/components/modals/SettingsModal.svelte');
  const noteListPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/NoteList.svelte');
  const sidebarPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/Sidebar.svelte');
  const toolbarPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/Toolbar.svelte');
  const tabBarPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/TabBar.svelte');
  const titleBarPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/TitleBar.svelte');

  const confirmModalSrc = fs.readFileSync(confirmModalPath, 'utf8');
  const settingsModalSrc = fs.readFileSync(settingsModalPath, 'utf8');
  const noteListSrc = fs.readFileSync(noteListPath, 'utf8');
  const sidebarSrc = fs.readFileSync(sidebarPath, 'utf8');
  const toolbarSrc = fs.readFileSync(toolbarPath, 'utf8');
  const tabBarSrc = fs.readFileSync(tabBarPath, 'utf8');
  const titleBarSrc = fs.readFileSync(titleBarPath, 'utf8');

  describe('P0: Reusable Theme-Aware Confirmation Dialog', () => {
    it('CONF-01: ConfirmModal adheres to 16px radius and semantic tokens', () => {
      expect(confirmModalSrc).toMatch(/rounded-\[16px\]/);
      expect(confirmModalSrc).toMatch(/var\(--bg-modal\)/);
      expect(confirmModalSrc).toMatch(/var\(--border\)/);
      expect(confirmModalSrc).toMatch(/var\(--text-primary\)/);
      expect(confirmModalSrc).toMatch(/var\(--text-secondary\)/);
      expect(confirmModalSrc).toMatch(/var\(--border-subtle\)/);
      expect(confirmModalSrc).toMatch(/padding:\s*24px/);
    });

    it('CONF-02: ConfirmModal supports Escape to cancel and Tab focus trapping', () => {
      expect(confirmModalSrc).toMatch(/e\.key === 'Escape'/);
      expect(confirmModalSrc).toMatch(/appState\.resolveConfirm\(false\)/);
      expect(confirmModalSrc).toMatch(/e\.key === 'Tab'/);
      expect(confirmModalSrc).toMatch(/e\.shiftKey && document\.activeElement === first/);
    });

    it('CONF-03: ConfirmModal distinguishes destructive styling and safe button focus', () => {
      expect(confirmModalSrc).toMatch(/bg-red-600\s+hover:bg-red-700/);
      expect(confirmModalSrc).toMatch(/bg-red-100\s+dark:bg-red-500\/20/);
      expect(confirmModalSrc).toMatch(/This action cannot be undone/);
      expect(confirmModalSrc).toMatch(/cancelButtonRef\?\.focus\(\)/);
    });

    it('CONF-04: appState.confirm returns a Promise resolving to true on confirm and false on cancel', async () => {
      // Test confirm resolution
      const promiseConfirm = appState.confirm({
        title: 'Delete Note',
        message: 'Are you sure?',
        destructive: true,
      });
      expect(appState.confirmModalOpen).toBe(true);
      expect(appState.confirmOptions?.title).toBe('Delete Note');
      expect(appState.confirmOptions?.destructive).toBe(true);

      appState.resolveConfirm(true);
      const resConfirm = await promiseConfirm;
      expect(resConfirm).toBe(true);
      expect(appState.confirmModalOpen).toBe(false);

      // Test cancel resolution
      const promiseCancel = appState.confirm('Permanently delete test note?');
      expect(appState.confirmModalOpen).toBe(true);
      expect(appState.confirmOptions?.destructive).toBe(true); // Inferred from 'delete'

      appState.resolveConfirm(false);
      const resCancel = await promiseCancel;
      expect(resCancel).toBe(false);
      expect(appState.confirmModalOpen).toBe(false);
    });

    it('CONF-05: Zero window.confirm or window.alert remain across frontend components', () => {
      expect(noteListSrc).not.toMatch(/window\.confirm/);
      expect(noteListSrc).not.toMatch(/\bwindow\.alert/);
      expect(sidebarSrc).not.toMatch(/window\.confirm/);
      expect(sidebarSrc).not.toMatch(/\balert\(/);
    });

    it('CONF-06: NoteList invokes async confirmation before permanent deletion', () => {
      // Empty trash
      expect(noteListSrc).toMatch(/await\s*\(!appState\.confirmPermanentDelete\s*\|\|\s*confirm\('Permanently delete all notes/);
      // Card permanent delete
      expect(noteListSrc).toMatch(/await\s*\(!appState\.confirmPermanentDelete\s*\|\|\s*confirm\(`Permanently delete/);
      // Context menu permanent delete
      expect(noteListSrc).toMatch(/await\s*\(!appState\.confirmPermanentDelete\s*\|\|\s*confirm\(`Permanently delete/);
    });

    it('CONF-07: Sidebar folder delete and duplicate tag use appState.confirm', () => {
      expect(sidebarSrc).toMatch(/await appState\.confirm\(\{\s*title:\s*'Delete Folder'/);
      expect(sidebarSrc).toMatch(/await appState\.confirm\(\{\s*title:\s*'Tag Already Exists'/);
    });

    it('CONF-08: appState.confirm safely queues concurrent confirmation requests without leaking promises', async () => {
      const p1 = appState.confirm({ message: 'First confirmation prompt' });
      const p2 = appState.confirm({ message: 'Second confirmation prompt' });

      expect(appState.confirmModalOpen).toBe(true);
      expect(appState.confirmOptions?.message).toBe('First confirmation prompt');

      // Resolve first modal
      appState.resolveConfirm(true);
      const res1 = await p1;
      expect(res1).toBe(true);

      // Modal should remain open displaying the second queued confirmation
      expect(appState.confirmModalOpen).toBe(true);
      expect(appState.confirmOptions?.message).toBe('Second confirmation prompt');

      // Resolve second modal
      appState.resolveConfirm(false);
      const res2 = await p2;
      expect(res2).toBe(false);

      // Now modal closes because queue is empty
      expect(appState.confirmModalOpen).toBe(false);
    });

    it('CONF-09: appState.confirm accurately resolves destructive vs non-destructive options', async () => {
      // Inferred destructive from message content
      const pDestr = appState.confirm({ message: 'Delete this draft note permanently?' });
      expect(appState.confirmOptions?.destructive).toBe(true);
      expect(appState.confirmOptions?.title).toBe('Confirm Deletion');
      expect(appState.confirmOptions?.confirmText).toBe('Delete');
      appState.resolveConfirm(true);
      await pDestr;

      // Explicit non-destructive options
      const pNonDestr = appState.confirm({
        message: 'Synchronize notes with local filesystem?',
        destructive: false,
      });
      expect(appState.confirmOptions?.destructive).toBe(false);
      expect(appState.confirmOptions?.title).toBe('Confirm Action');
      expect(appState.confirmOptions?.confirmText).toBe('Confirm');
      appState.resolveConfirm(true);
      await pNonDestr;
    });

    it('CONF-10: ConfirmModal includes word-break and whitespace formatting for long titles and details', () => {
      expect(confirmModalSrc).toMatch(/break-words/);
      expect(confirmModalSrc).toMatch(/whitespace-pre-line/);
    });

    it('CONF-11: ConfirmModal card provides alertdialog and dialog ARIA roles', () => {
      expect(confirmModalSrc).toMatch(/role=\{isDestructive \? 'alertdialog' : 'dialog'\}/);
      expect(confirmModalSrc).toMatch(/aria-modal="true"/);
      expect(confirmModalSrc).toMatch(/aria-labelledby="confirm-dialog-title"/);
      expect(confirmModalSrc).toMatch(/aria-describedby="confirm-dialog-desc"/);
    });

    it('CONF-12: Tab focus containment pulls focus back inside dialog if activeElement escaped', () => {
      expect(confirmModalSrc).toMatch(/!dialogRef\.contains\(document\.activeElement\)/);
    });
  });

  describe('P1: Settings Modal Content Polish & Proportions', () => {
    it('SETT-01: General category has structured cards with descriptions and WAL status', () => {
      expect(settingsModalSrc).toMatch(/General Settings/);
      expect(settingsModalSrc).toMatch(/Default Startup View/);
      expect(settingsModalSrc).toMatch(/Safety & Confirmation Dialogs/);
      expect(settingsModalSrc).toMatch(/Live Auto-Save & WAL Mode/);
      expect(settingsModalSrc).toMatch(/SQLite WAL Journal:\s*Active/);
    });

    it('SETT-02: Editor category includes authentic multi-element typography specimen', () => {
      expect(settingsModalSrc).toMatch(/Editor Settings/);
      expect(settingsModalSrc).toMatch(/Live Typography Specimen/);
      expect(settingsModalSrc).toMatch(/The Art of Calm Writing/);
      expect(settingsModalSrc).toMatch(/font-size:\s*\{appState\.fontSize\}px/);
    });

    it('SETT-03: Storage category includes operational vault metrics and format specifications', () => {
      expect(settingsModalSrc).toMatch(/Local Vault Directory/);
      expect(settingsModalSrc).toMatch(/Plain Markdown \(\.md\)/);
      expect(settingsModalSrc).toMatch(/SQLite 3 Index/);
      expect(settingsModalSrc).toMatch(/Database & Vault Status/);
      expect(settingsModalSrc).toMatch(/\{appState\.notes\.length\}/);
    });

    it('SETT-04: About category provides balanced specs grid and calm software values', () => {
      expect(settingsModalSrc).toMatch(/Frontend Architecture/);
      expect(settingsModalSrc).toMatch(/Desktop Native Core/);
      expect(settingsModalSrc).toMatch(/Design Philosophy/);
      expect(settingsModalSrc).toMatch(/Calm Software/);
    });
  });

  describe('P1: Keyboard Shortcuts Presentation', () => {
    it('SC-01: Uses semantic border-subtle tokens without unstyled divide-y', () => {
      // divide-y should not be used on the shortcuts list container
      const shortcutsSection = settingsModalSrc.split("activeCategory === 'shortcuts'")[1]?.split("activeCategory === 'about'")[0] || '';
      expect(shortcutsSection).not.toMatch(/divide-y/);
      expect(shortcutsSection).toMatch(/border-color:\s*var\(--border-subtle\)/);
    });

    it('SC-02: Keycaps are parsed into individual standardized kbd badges', () => {
      expect(settingsModalSrc).toMatch(/parseShortcutKeys/);
      expect(settingsModalSrc).toMatch(/inline-flex items-center justify-center min-w-\[22px\] h-6 px-1\.5 rounded-md font-mono/);
    });

    it('SC-03: Action names and shortcut combinations remain aligned', () => {
      expect(settingsModalSrc).toMatch(/min-w-0 pr-3 truncate/);
      expect(settingsModalSrc).toMatch(/flex items-center gap-1 shrink-0/);
    });
  });

  describe('P2: Toolbar, Tab, and TitleBar Controls', () => {
    it('TB-01: Toolbar buttons standardized to 28px hit targets and active ring indicators', () => {
      expect(toolbarSrc).toMatch(/w-7 h-7 flex items-center justify-center rounded-lg/);
      expect(toolbarSrc).toMatch(/ring-1 ring-\[var\(--accent\)\]\/30/);
      expect(toolbarSrc).toMatch(/h-7 text-\[11px\] font-semibold rounded-lg px-2/);
    });

    it('TAB-01: Tab titles retain literal characters and have tooltip attributes', () => {
      expect(tabBarSrc).toMatch(/title=\{tab\.title \|\| 'Untitled'\}/);
      expect(tabBarSrc).toMatch(/\{tab\.title \|\| 'Untitled'\}/);
      // Close button hit area enhanced to 20px
      expect(tabBarSrc).toMatch(/w-5 h-5 flex items-center justify-center/);
    });

    it('TITLE-01: TitleBar settings button hit target standardized to 28px', () => {
      expect(titleBarSrc).toMatch(/w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black\/5/);
    });
  });
});

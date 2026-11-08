# 02 — Final Implementation Plan & Conflict Reconciliation

**Project:** Notebox UI/UX Redesign  
**Document:** Final Implementation Plan  
**Status:** Approved & Authoritative  

---

## 1. Conflict Reconciliation & Priority Hierarchy

When reconciling requirements from the 11 Markdown documents, the PDF specification, and the visual reference images, the following priority order is strictly enforced:

1. **Explicit established user decisions** (Highest priority)
2. **Requirements in the UI Design Specification** (`01_UI_DESIGN_SPECIFICATION.md`)
3. **Detailed Component Specifications** (`03_COMPONENT_SPECIFICATIONS.md`)
4. **Functional Specifications** (`05_TAG_MANAGEMENT_SPEC.md`, `06_SETTINGS_AND_THEME_SPEC.md`)
5. **Visual References** (`target_main_ui.png`, `layout_geometry.png`, `settings_target_layout.png`, etc.)
6. **General Implementation Recommendations**

### Reconciled Decisions:

1. **Sidebar Footer vs. TitleBar Global Controls:**
   - *Conflict:* Early mockups (`target_main_ui.png`) show a Settings button at the bottom of the sidebar. The existing running code has both a sidebar footer card (Settings + Palette switcher) and TitleBar controls.
   - *Resolution:* Under the user's latest and most explicit decision (`00_README.md` item 5, `06_SETTINGS_AND_THEME_SPEC.md` section 1), remove the redundant bottom-left sidebar footer card completely. Keep exactly one global Settings entry point and one theme quick-switcher in the top-right TitleBar. Both have been verified as working.

2. **Tag Associations on Rename and Delete:**
   - *Requirement:* Tags must be editable, recolorable, and deletable.
   - *Resolution:* Because SQLite schema stores tag relations as `(note_id, tag_id)` in `note_tags`, renaming a tag in `tags` table preserves all note associations without modifying note IDs. Deleting a tag triggers `FOREIGN KEY ... ON DELETE CASCADE` on `note_tags`, removing associations cleanly while leaving all note records intact. If the currently filtered tag is deleted, `appState` gracefully clears `selectedTag` to return to All Notes.

3. **Workspace Outer and Inter-Panel Gutters:**
   - *Requirement:* 10px outer workspace gutter, 10px inter-panel gutter.
   - *Resolution:* Parent `.workspace-container` has `padding: 10px` (`--workspace-gutter`). The splitter element itself has `width: 10px` (`--panel-gutter`), with a 1px subtle visual drag indicator centered within it. No double-counted gaps or margins are applied.

4. **Settings Modal Architecture:**
   - *Conflict:* Previous implementation was a single vertical scrolling modal with mixed settings.
   - *Resolution:* Implement a 2-column modal matching `settings_target_layout.png`: Left rail with 6 categories (General, Appearance, Editor, Storage, Shortcuts, About); Right pane with categorized content. Ensure responsive behavior at narrower viewports.

---

## 2. Phase-by-Phase Execution Roadmap

### Phase 1: Design Tokens & CSS Consolidation (`src/app.css`)
- Verify all CSS variables across all 6 themes (`warm-paper`, `midnight`, `forest`, `ocean`, `lavender`, `sunset`).
- Standardize tokens:
  - `--space-1` through `--space-12` (4px to 48px)
  - `--radius-control` (8px), `--radius-input` (10px), `--radius-card` (12px), `--radius-panel` (16px), `--radius-modal` (16px), `--radius-pill` (9999px)
  - `--workspace-gutter: 10px;`, `--panel-gutter: 10px;`
  - `--border-card-active: #9D76F5;`
- Ensure no broken styling or ProseMirror regressions.

### Phase 2: Backend Tag CRUD Implementation (`src-tauri` & `src/lib/services/ipc.ts`)
- In `src-tauri/src/commands/tags.rs`:
  - Implement `update_tag(state, id, name, color) -> Result<Tag, String>`:
    - Validate name is not empty (after trimming).
    - Validate case-insensitive name uniqueness against other tags.
    - Execute `UPDATE tags SET name = ?1, color = ?2 WHERE id = ?3`.
    - Return updated `Tag` struct.
- In `src-tauri/src/lib.rs`:
  - Register `commands::tags::update_tag` in the invoke handler.
- In `src/lib/services/ipc.ts`:
  - Add `updateTag(id: string, name?: string, color?: string): Promise<Tag>`.
- In `src/lib/stores/appState.svelte.ts`:
  - Add `updateTag(id: string, name: string, color: string)`:
    - Calls `tagService.updateTag`.
    - Updates local tag state and reloads notes if active.
    - If active tag was renamed, updates `selectedTag`.
  - Add `deleteTag(id: string)`:
    - Calls `tagService.deleteTag`.
    - If active tag was deleted, clears `selectedTag`.
    - Reloads tags and notes.

### Phase 3: Sidebar Redesign & Tag Management UI (`src/lib/components/layout/Sidebar.svelte`)
- Remove redundant bottom floating footer card (Settings & Theme palette button).
- Keep sidebar clean with Search, Quick Access, Folders, and Tags.
- Implement Tag Action Menu for every tag row:
  - Interactive trailing ellipsis button `...` (visible on hover and keyboard focus).
  - Popover / modal menu with options:
    1. **Edit Tag Name:** Modal/input with duplicate and empty validation.
    2. **Change Color:** Swatch picker with 8 curated accessible swatches (`TAG_COLORS`).
    3. **Delete Tag:** Confirmation dialog with clear warning: "Deleting the tag '#tag' removes the tag from all notes, but will NOT delete any notes."

### Phase 4: Settings Modal 6-Category Architecture (`src/lib/components/modals/SettingsModal.svelte`)
- Refactor layout into a 2-column modal (Left nav rail + Right content pane):
  - **General:** Startup view preference, default note title, confirmation toggles.
  - **Appearance:** 6 curated themes with card previews, dots, and selected checkmark; interface density selector (Comfortable / Compact / Spacious).
  - **Editor:** Font size slider (12-24px), font family selection, word wrap toggle, line height options.
  - **Storage:** Local vault directory path, SQLite database status, Markdown storage explanation.
  - **Shortcuts:** Categorized, searchable table of keyboard shortcuts with platform-appropriate modifier keys.
  - **About:** Notebox branding, version (v0.1.0), description, license, technology credits.
- Accessibility: `role="dialog"`, `aria-modal="true"`, focus trap, Escape key handling.

### Phase 5: Recently Deleted Refinement (`src/lib/components/layout/NoteList.svelte`)
- Header: Display "Recently Deleted" with note count and "Delete All" action (with confirmation dialog).
- Note cards:
  - Metadata shows "Deleted [date/time]" instead of generic "Today".
  - Quick action buttons on each card:
    - **Restore Note:** Calls `appState.restoreNote(note.id)`. Handles orphan notes whose folder was deleted gracefully.
    - **Delete Permanently:** Prompts confirmation and calls `appState.deleteNote(note.id, true)`.
- Empty State: Informative message that deleted notes can be restored or permanently removed.

### Phase 6: TabBar, Toolbar, Editor, and Secondary Components Refinements
- **TabBar:** Polish active tab contrast, persistent close button on active tab, inactive tab hover close button, conditional overflow chevrons.
- **Toolbar:** Ensure all tool buttons have accessible labels, tooltips, logical dividers, and minimum 28px hit areas.
- **Editor:** Preserve Tiptap editor features, ensure top-left alignment, 28-40px horizontal insets, word-wrap CSS enforcement.
- **Secondary Modals:** Ensure PasswordModal and ExportModal adhere to the exact 16px radius and color token standards.

### Phase 7: Verification, Multi-Resolution Screenshots, & Quality Reporting
- Run `npm run check` (Svelte/TypeScript diagnostics).
- Run `npm run test` (Vitest suites).
- Run `cargo test` in `src-tauri`.
- Run `npm run build` (Production static build).
- Capture automated headless screenshots at 1280x720, 1366x768, 1600x900, 1920x1080 across all views:
  - All Notes
  - Folder selected
  - Tag selected
  - Recently Deleted
  - Settings (General, Appearance, Editor, Storage, Shortcuts, About)
  - Theme quick-switcher
  - Tag actions menu / edit dialog
  - Multi-tab overflow
  - Collapsed sidebar
- Generate all required reports in `docs/uiux/`.

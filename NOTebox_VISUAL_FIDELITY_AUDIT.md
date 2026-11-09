# NOTEBOX — VISUAL FIDELITY AUDIT REPORT
**Phase 1: Inspect, Compare, and Diagnose**

- **Date:** November 2026
- **Auditor Role:** Senior UI/UX Engineer, Frontend Architect, and Visual QA Specialist
- **Workspace:** `C:\Users\Kurados\.gemini\antigravity\scratch\noteflow`
- **Active Branch:** `feature/ui-refined-package`
- **Design Authority:** `Notebox_UIUX_Implementation_Kit` (`00_README.md` – `10_REPOSITORY_AUDIT_AND_FILE_MAP.md`, `Notebox_UIUX_Implementation_Guide.pdf`, and visual reference suite)
- **Status:** Complete Audit — Diagnostic Phase Only (Zero Source Mutations)

---

## 1. Executive Summary

A comprehensive visual fidelity and architectural audit of the Notebox application was conducted on branch `feature/ui-refined-package`. The application stack consists of **Svelte 5 (Runes)**, **TypeScript 6**, **Tailwind CSS v4**, **Vite 8**, and **Tauri v2 (Rust + SQLite3 WAL)**.

While the branch successfully implements key architectural milestones (three-island floating workspace, custom macOS traffic lights, 6-theme semantic palettes, Tiptap markdown integration, and Rust-level tag CRUD safety with SQLite cascades), a rigorous side-by-side inspection against the approved design package (`target_main_ui.png`, `settings_target_layout.png`, `tag_management_target.png`, and the specification suite) revealed **40 distinct visual and structural defects**.

### Defect Distribution by Severity

| Priority | Definition | Count | Key Highlights |
|---|---|:---:|---|
| **P0 — Critical** | Visual clipping, inaccessible controls, broken interactivity | **5** | Tag action ellipsis overlapping note counts; modal buttons touching rounded boundaries; traffic light hit targets under 10px; hardcoded hex colors destroying dark theme legibility; splitter dragging lagging behind cursor due to active CSS transitions. |
| **P1 — High** | Major deviation from approved specification | **14** | Settings modal forced to `h-[620px]` causing 70% dead space; title bar height +6px excess; missing Tiptap active formatting indicators in Toolbar; redundant sidebar open buttons in 3 components; theme swatch 5th dot clipped in TitleBar quick switcher; Settings controls lacking persistence. |
| **P2 — Medium** | Inconsistent spacing, typography, or token conflict | **15** | Panel header vertical misalignment across columns (40px vs 44px vs 38px); conflicting duplicate CSS custom properties (`--editor-min-width`); card padding below specification (8px vs 10–12px); fragile hex string opacity concatenation (`${color}18`); unstyled range slider. |
| **P3 — Low** | Polish, missing tooltips, or minor cosmetic details | **6** | Missing window title tooltip on long note titles; missing external links in About modal; unstyled focus rings on secondary dialogs. |
| **Total** | | **40** | |

---

## 2. Reference Inventory

The approved UI/UX design package and existing repository deliverables were cataloged and segregated into authoritative design targets versus legacy/pre-redesign references:

### A. Authoritative Target Specifications & Diagrams
1. **`target_main_ui.png`** (`C:\Users\Kurados\Downloads\Notebox_UIUX_Implementation_Kit\visual_references\target_main_ui.png`): Generated visual target defining three floating island panels, 10px outer and inter-panel gutters, 16px panel radii, 12px card radii, top-left anchored editor canvas, active tab styling, and floating status capsule.
2. **`settings_target_layout.png`**: Target diagram establishing 2-column categorized settings (left rail + right pane) with a balanced 3-column x 2-row theme card grid.
3. **`tag_management_target.png`**: Interaction diagram establishing tag row ellipsis action menu (Edit tag name, Change color, Delete tag) and non-destructive tag deletion confirmation.
4. **`layout_geometry.png`**: Workspace geometry diagram defining 10px outer workspace gutter, 10px splitter width, and independent scrolling bounds.
5. **Specification Markdown Package (`00` to `10`)**:
   - `01_UI_DESIGN_SPECIFICATION.md`: Geometry, hierarchy, typography, insets, and theme decisions.
   - `02_DESIGN_TOKENS_AND_TAILWIND.md`: Spacing scale, radii, semantic tokens, and Tailwind v4 usage rules.
   - `03_COMPONENT_SPECIFICATIONS.md`: Component responsibilities and state transitions.
   - `05_TAG_MANAGEMENT_SPEC.md`: Full tag lifecycle, validation, and relational integrity requirements.
   - `06_SETTINGS_AND_THEME_SPEC.md`: Settings information architecture and theme synchronization.
   - `07_ACCESSIBILITY_AND_QA.md`: WCAG criteria, responsive desktop breakpoints, and acceptance checklist.
   - `Notebox_UIUX_Implementation_Guide.pdf`: 11-page master design authority.

### B. Pre-Redesign Baseline References (For Contrast & Regression Diagnosis)
- `current_main_ui.png`: Legacy state showing duplicate sidebar footer Settings/theme buttons, card border outlines, and crowded cards.
- `current_settings.png`: Legacy uncategorized single-page modal.
- `current_tabbar.png`: Legacy tab bar with hidden close controls.
- `current_theme_picker.png`: Legacy theme selector popover.
- `current_recently_deleted.png`: Legacy trash view with low-contrast header button and "Today" metadata.

---

## 3. Current Implementation Inventory

### Frontend Component Architecture (`src/`)
- `routes/+layout.svelte` & `routes/+page.svelte`: Root window layout, splitter drag listeners, keyboard shortcuts, and modal mounts.
- `src/lib/components/layout/TitleBar.svelte`: Frameless title bar, traffic lights, window title, view toggles, palette quick switcher, and settings trigger.
- `src/lib/components/layout/Sidebar.svelte`: Search, Quick Access, Folders, Tags, Tag action menu, Edit Tag dialog, Delete Tag dialog.
- `src/lib/components/layout/NoteList.svelte`: View title, count, sort options, compose note, note cards, card badges, trash header, card context menu.
- `src/lib/components/layout/TabBar.svelte`: Open tabs, active tab pill, dirty indicator, horizontal wheel scroll, overflow chevrons, new tab button.
- `src/lib/components/layout/Toolbar.svelte`: Text styles, inline marks, lists, tables, images, blockquotes, code blocks, view utilities.
- `src/lib/components/layout/Editor.svelte`: Tiptap editor instance, markdown serializer/parser, title input, metadata line, divider, zoom scaling, word-wrap.
- `src/lib/components/layout/StatusBar.svelte`: Floating capsule status bar, save status, word count, cursor position, zoom controls, wrap toggle.
- `src/lib/components/layout/FindReplace.svelte`: In-note find and replace bar.
- `src/lib/components/modals/SettingsModal.svelte`: 2-column categorized settings modal (General, Appearance, Editor, Storage, Shortcuts, About).
- `src/lib/components/modals/PasswordModal.svelte`: AES-256 password lock/unlock modal.
- `src/lib/components/modals/ExportModal.svelte`: Markdown, plain text, HTML, and print/PDF export dialog.
- `src/lib/stores/appState.svelte.ts`: Global reactive store powered by Svelte 5 runes (`$state`, `$derived`).
- `src/lib/services/ipc.ts`: Tauri IPC wrappers with in-memory fallbacks for headless browser environments.
- `src/app.css`: Tailwind v4 import, 4px spacing scale, 6 curated color themes, typography rules, and panel layout classes.

### Backend Native Layer (`src-tauri/`)
- `src-tauri/src/commands/tags.rs`: `get_tags`, `create_tag`, `update_tag`, `delete_tag`.
- `src-tauri/src/commands/notes.rs`: `get_notes`, `create_note`, `read_note`, `save_note`, `delete_note`, `restore_note`, `empty_trash`.
- `src-tauri/tests/backend_tests.rs`: 11 integration tests covering encryption, migrations, tag CRUD, and checklist sync.

### Visual Test Capture Manifest (`docs/uiux/screenshots/after/`)
- `after_main_1280x720.png`: 1280×720 HD desktop baseline.
- `after_main_1366x768.png`: 1366×768 Standard Laptop baseline.
- `after_main_1600x900.png`: 1600×900 Mid-tier desktop baseline.
- `after_main_1920x1080.png`: 1920×1080 Full HD widescreen baseline.
- `after_sidebar_collapsed_1366x768.png`: Collapsed sidebar state.
- `after_folder_selected_1366x768.png`: Folder navigation highlight state.
- `after_tag_selected_1366x768.png`: Tag navigation highlight & action menu state.
- `after_tag_edit_dialog_1366x768.png`: Edit Tag dialog state.
- `after_recently_deleted_1366x768.png`: Recently Deleted trash view state.
- `after_theme_picker_1366x768.png`: Color Palette Library popover state.
- `after_settings_general_1366x768.png`: Settings modal — General category.
- `after_settings_appearance_1366x768.png`: Settings modal — Appearance category.
- `after_settings_editor_1366x768.png`: Settings modal — Editor category.
- `after_settings_storage_1366x768.png`: Settings modal — Storage category.
- `after_settings_shortcuts_1366x768.png`: Settings modal — Shortcuts category.
- `after_settings_about_1366x768.png`: Settings modal — About category.

---

## 4. Requirement-to-Implementation Matrix

| Requirement ID | Area | Target Specification | Current Code Status | Fidelity Finding |
|---|---|---|---|:---:|
| **REQ-DS-01** | Design Tokens | 4px scale, standardized radii, 10px gutters | `app.css` defines `--space-*`, `--radius-*`, `--workspace-gutter` | **Partial**: Conflicting duplicate definitions for `--editor-min-width` (360px vs 320px). |
| **REQ-DS-02** | Theme Palettes | 6 semantic themes (`warm-paper`, `midnight`, `forest`, `ocean`, `lavender`, `sunset`) | 6 themes defined in `app.css`, stored in `types/index.ts` | **Defective**: Components use hardcoded lavender hex `#E4D1FA` and `#2C1A4A`, breaking dark themes. |
| **REQ-LAY-01** | Gutters | 10px outer workspace gutter, 10px panel gutter via splitter | `.workspace-container` padding 10px, splitter width 10px | **Complete**: Box model correctly implements single 10px gutter without doubling. |
| **REQ-LAY-02** | Three Islands | Floating panels, 16px radius, subtle border & shadow | `.sidebar-panel`, `.notelist-panel`, `.editor-panel` styled | **Defective**: Panel headers vertically misaligned (40px vs 44px vs 38px). |
| **REQ-LAY-03** | Splitter Resize | Clamped interactive resizing with persistence | Splitter listeners in `+page.svelte` | **Defective**: Splitter dragging stutters because CSS `transition-[width]` remains active during drag. |
| **REQ-SB-01** | Sidebar Nav | 32–36px row height, soft accent fill, aligned counts | `Sidebar.svelte` navigation rows | **Defective**: Tag note counts collide with ellipsis action button; folder actions invisible to keyboard. |
| **REQ-SB-02** | Sidebar Footer | Eliminate duplicate Settings & theme buttons | Sidebar footer controls removed | **Complete**: Duplicate sidebar footer controls successfully removed. |
| **REQ-TAG-01** | Tag Create | Trim whitespace/hash, reject duplicates, custom color | `Sidebar.svelte` & `tags.rs` | **Complete**: Tag creation validates whitespace, `#` prefix, and case-insensitive duplicates. |
| **REQ-TAG-02** | Tag Rename | Preserve stable tag ID and relational `note_tags` | `tags.rs` `update_tag` & `ipc.ts` | **Complete**: Tag rename preserves ID and relational links; tested via Vitest & Cargo test. |
| **REQ-TAG-03** | Tag Recolor | Curated swatches; instant update across sidebar & chips | `Sidebar.svelte`, `tags.rs` | **Complete**: Color persists to SQLite and refreshes reactive store. |
| **REQ-TAG-04** | Tag Delete | Cascade `note_tags`, NEVER delete note records | `tags.rs` `delete_tag` | **Complete**: Note records remain untouched when tags are deleted. |
| **REQ-TAG-05** | Tag Row Menu | Ellipsis action menu (`...`) with mouse & keyboard access | `Sidebar.svelte` tag dropdown | **Defective**: Menu only offers Edit and Delete (omits Change Color); overlaps with note count. |
| **REQ-NL-01** | Note Cards | 12px radius, 10–12px padding, 8px gap, metadata chips | `NoteList.svelte`, `app.css` | **Partial**: Card vertical padding is 8px (under 10–12px spec); tag chip hex opacity is fragile. |
| **REQ-NL-02** | Card Selection | Light accent surface, visible accent border, readable text | `.notelist-card-item.is-selected` | **Complete**: Light accent surface with 1.5px accent border; no dark block inversion. |
| **REQ-TB-01** | Tab Bar | 36px height, white card active tab, close on active | `TabBar.svelte`, `app.css` | **Partial**: Height is `h-9.5` (38px); active tab correctly styled as white pill. |
| **REQ-TB-02** | Tab Overflow | Conditional scroll chevrons via ResizeObserver | `TabBar.svelte` ResizeObserver | **Defective**: Renders redundant sidebar open button when sidebar is collapsed. |
| **REQ-TL-01** | Toolbar | Logical groups, min 28px hit areas, active formatting feedback | `Toolbar.svelte` | **Defective**: Completely lacks active formatting feedback (buttons do not reflect Tiptap marks). |
| **REQ-ED-01** | Editor Layout | Top-left document anchor, 28–40px insets, shared title alignment | `Editor.svelte`, `app.css` | **Complete**: Document is top-left anchored with 40px horizontal padding and matching title/metadata. |
| **REQ-ED-02** | Tiptap Rich Text | Full preservation of markdown, tables, checklists | `Editor.svelte`, `markdown.ts` | **Complete**: Markdown parsing, tasks, tables, and images preserved. |
| **REQ-ED-03** | Word Wrap | Toggle dynamically enforces real CSS whitespace rules | `.editor-no-wrap` in `app.css` | **Complete**: Word-wrap toggle switches `white-space: pre !important` and `word-break: normal`. |
| **REQ-ST-01** | Status Bar | 26–30px height, floating capsule, two aligned groups | `StatusBar.svelte`, `app.css` | **Partial**: Matches target floating capsule design; lacks overflow defense at 320px minimum width. |
| **REQ-SET-01** | Settings Modal | 6 categories, left rail + right content pane | `SettingsModal.svelte` | **Defective**: Modal hardcoded to `h-[620px]`, causing up to 70% empty void across 5 categories. |
| **REQ-SET-02** | Appearance Settings | 6 theme cards in balanced grid, synchronized with title bar | `SettingsModal.svelte` | **Partial**: Uses 2-column grid instead of 3-column target; preview dots touch card bottom. |
| **REQ-SET-03** | Modal Accessibility | Focus trap, Esc to close, background click closes | `SettingsModal.svelte` | **Complete**: Focus trap and Escape key listener present in Settings modal. |
| **REQ-TR-01** | Recently Deleted Header | "RECENTLY DELETED", count, red "Delete All" action | `NoteList.svelte` | **Complete**: Header renders red "Delete All" with confirmation dialog. |
| **REQ-TR-02** | Trash Actions | Explicit Restore (`RotateCcw`) and Purge (`Trash2`) | `NoteList.svelte` | **Complete**: Note cards render dedicated Restore and Permanent Delete buttons. |
| **REQ-TR-03** | Trash Purge Safety | Delete All and Permanent Delete confirm before execution | `NoteList.svelte` | **Complete**: Confirmation dialogs guard destructive purges. |
| **REQ-TR-04** | Restore Fallback | Fallback to uncategorized if original folder was deleted | `notes.rs` & `ipc.ts` | **Complete**: Restored notes fallback to root (`folder_id = null`) if folder missing. |
| **REQ-SEC-01** | Secondary Modals | Shared surface language, 16px radius, `--bg-modal` | `PasswordModal.svelte`, `ExportModal.svelte` | **Complete**: Modals share 16px radius and semantic tokens. |

---

## 5. Visual Discrepancy Register across All 20 Specified Areas

### Area 1: Main Three-Panel Workspace
- **File:** `src/routes/+page.svelte` (lines 185–230), `src/app.css` (lines 680–745).
- **Target Requirement:** 10px outer workspace gutter, 10px inter-panel gutter, 16px panel radii, smooth interactive splitter drag clamping without lag, panel headers vertically aligned.
- **Actual Implementation:** Outer gutter and panel radii are correct. However, panel headers across the three columns are set to three different heights (Sidebar: 40px, NoteList: 44px, Editor TabBar: 38px), creating visible stepped border misalignments. Furthermore, `<aside class="sidebar-panel">` and `<section class="notelist-panel">` have unconditional `transition-[width] duration-200 ease-in-out` classes attached during active dragging.
- **Exact Visual Discrepancy:**
  1. Horizontal divider borders between panel headers do not line up across the workspace.
  2. Splitter dragging stutters and rubber-bands behind the cursor by 200ms.
- **Probable Root Cause:** Transition class not conditioned on dragging state; independent height classes used in separate components.
- **Recommended Correction:**
  1. Add `class:transition-none={isDraggingSidebar || isDraggingNoteList}` to both panels.
  2. Standardize panel header height to `var(--panel-header-height, 44px)`.
- **Verification Method:** Inspect horizontal alignment line across all 3 panels at 1366×768; drag splitters rapidly to confirm zero lag.

### Area 2: Window Title Bar and Controls
- **File:** `src/lib/components/layout/TitleBar.svelte` (lines 61–125).
- **Target Requirement:** 38px title bar height (`--titlebar-height: 38px`); 28px accessible hit targets; center title truncated with tooltip; macOS traffic lights with interactive hover glyphs.
- **Actual Implementation:** Line 63 uses Tailwind `h-11` (44px), exceeding the 38px specification by 6px. Traffic light buttons (lines 75, 85, 95) are sized `w-2.5 h-2.5` (10px × 10px) with no padding wrapper, providing an inaccessible hit target. Center note title has `truncate max-w-sm` but lacks a `title` tooltip attribute.
- **Exact Visual Discrepancy:**
  1. Title bar appears disproportionately tall compared to the compact 38px design in `target_main_ui.png`.
  2. Clicking slightly off-center on traffic lights fails to activate them.
  3. Long titles are truncated with ellipses without hover tooltips.
- **Probable Root Cause:** Use of `h-11` utility instead of `h-[38px]`; omission of padding wrappers on 10px circular spans.
- **Recommended Correction:**
  1. Change header class to `h-[38px]`.
  2. Wrap traffic light dots in 24–28px hit buttons.
  3. Add `title={appState.activeTab?.title || 'Notebox'}` to the center title container.
- **Verification Method:** Measure bounding box in DOM; verify click activation within 24px of traffic light centers.

### Area 3: Sidebar and Search Field
- **File:** `src/lib/components/layout/Sidebar.svelte` (lines 185–226).
- **Target Requirement:** 12–14px internal padding; search box 34px height with 10px radius (`--radius-input`); clean `Ctrl K` badge; single global sidebar toggle in title bar.
- **Actual Implementation:** Search box wrapper uses non-standard Tailwind class `h-8.5` (line 200) and `rounded-xl` (12px) instead of 10px. The sidebar header renders an extraneous `PanelLeftClose` button (lines 187–195), creating redundant controls.
- **Exact Visual Discrepancy:**
  1. Search container height fluctuates depending on Tailwind v4 parser fallback.
  2. Redundant collapse button in sidebar header duplicates title bar toggle.
- **Probable Root Cause:** Non-standard utility syntax `h-8.5`; legacy header button retained after title bar consolidation.
- **Recommended Correction:** Replace `h-8.5` with `h-[34px] rounded-[10px]`; remove the redundant collapse button from sidebar header.
- **Verification Method:** Visual comparison against `target_main_ui.png`.

### Area 4: Folder and Tag Navigation
- **File:** `src/lib/components/layout/Sidebar.svelte` (lines 230–540).
- **Target Requirement:** Soft accent fill (`--bg-sidebar-active`), readable text (`--accent-text`), right-aligned counters, tag color dots, hover actions. Theme-neutral semantic tokens.
- **Actual Implementation:** Lines 239, 256, 273, 290, 367, 515 hardcode `bg-[#E4D1FA] text-[#2C1A4A]` directly in component classes. In tag rows, the note count (line 525) and the absolute-positioned ellipsis action `<MoreHorizontal>` (line 541) are both placed at `right-1.5`. Folder rename/delete buttons (lines 406–425) use `opacity-0 group-hover:opacity-100` without focus-visible states.
- **Exact Visual Discrepancy:**
  1. In dark themes (Midnight, Forest, Sunset), active selection turns into a glaring light-lilac block with dark purple text.
  2. On tag row hover, the ellipsis icon renders directly on top of the note count number.
  3. Folder action buttons are invisible to keyboard-only users.
- **Probable Root Cause:** Hardcoded hex values bypassing `app.css` tokens; missing `group-hover/tag:opacity-0` on tag count span; missing `focus-visible` pseudo-classes on folder buttons.
- **Recommended Correction:**
  1. Replace hardcoded classes with `style="background-color: var(--bg-sidebar-active); color: var(--accent-text);"`.
  2. Add `group-hover/tag:opacity-0 group-focus-within/tag:opacity-0` to the tag count span.
  3. Add `focus-visible:opacity-100` to folder action buttons.
- **Verification Method:** Switch to Midnight theme and select folder; hover over `#work` tag and verify clean transition from count to ellipsis.

### Area 5: Tag Action Dropdown
- **File:** `src/lib/components/layout/Sidebar.svelte` (lines 545–582).
- **Target Requirement:** Menu options: 1. Edit tag, 2. Change color, 3. Delete tag (`tag_management_target.png`). Keyboard navigable, smooth boundary positioning.
- **Actual Implementation:** Dropdown renders only "Edit tag" and "Delete tag" (omits "Change color"). Positioned `absolute right-0 top-full mt-1` inside a scrollable flex container without viewport boundary checks. Focus is not moved into the menu on trigger.
- **Exact Visual Discrepancy:**
  1. Missing "Change color" quick swatch action.
  2. Dropdown on lower tags can trigger vertical scrollbar extension or get cut off.
- **Probable Root Cause:** Action merged into Edit modal; missing flip positioning and focus manager.
- **Recommended Correction:** Add "Change color" action (or inline swatches); implement upward flip when tag row is within 120px of container bottom.
- **Verification Method:** Open menu on the bottom-most tag row; verify full visibility without scroll jumps.

### Area 6: Edit Tag Dialog
- **File:** `src/lib/components/layout/Sidebar.svelte` (lines 590–686).
- **Target Requirement:** 16px radius, `--bg-modal`, 20–24px padding, non-empty and duplicate name validation, curated color swatches with active ring, safe button clearances.
- **Actual Implementation:** In `after_tag_edit_dialog_1366x768.png`, the "Save Changes" button touches the bottom-right rounded corner of the dialog with 0px margin. Dialog lacks a Tab key focus trap and input autofocus.
- **Exact Visual Discrepancy:** Purple "Save Changes" button jams against the modal's lower-right rounded border.
- **Probable Root Cause:** Container `p-5` combined with `gap-4` and `pt-2 border-t` collapses bottom padding inside the flex layout.
- **Recommended Correction:** Add explicit bottom padding `pb-5` to footer action bar; attach Tab focus trap.
- **Verification Method:** Inspect screenshot of Edit Tag dialog at 1366×768; verify at least 16px clearance from corner.

### Area 7: Delete Tag Confirmation Dialog
- **File:** `src/lib/components/layout/Sidebar.svelte` (lines 689–743).
- **Target Requirement:** Safe confirmation explaining tag link removal without note deletion; default focus on safe "Cancel" action.
- **Actual Implementation:** Text correctly explains note safety. However, default focus is not explicitly set to Cancel, and Tab key cycles out of the dialog into background workspace.
- **Exact Visual Discrepancy:** No visible focus ring on Cancel upon opening; focus escapes to background on Tab.
- **Probable Root Cause:** Missing `use:autoFocus` directive on Cancel button and missing focus trap listener.
- **Recommended Correction:** Add `use:autoFocus` to Cancel button and attach modal focus trap.
- **Verification Method:** Press Enter immediately upon opening; confirm dialog closes safely without deleting tag.

### Area 8: Note List and Note Cards
- **File:** `src/lib/components/layout/NoteList.svelte` (lines 100–330), `src/app.css` (lines 798–843).
- **Target Requirement:** 44px header height; cards separated by 8px; card radius 12px; card padding 10–12px; preview clamped to 2 lines; date on left; folder/tags on right; active card light accent surface with 1.5px accent border.
- **Actual Implementation:** NoteList header uses `h-10` in HTML conflicting with `min-height: 44px` in CSS. Card vertical padding in `app.css` line 817 is `8px` (below the 10–12px specification). Tag chip styling uses string-interpolated alpha `${tagInfo.color}18`, which breaks if colors are not 6-digit hex.
- **Exact Visual Discrepancy:**
  1. Cards appear slightly cramped vertically due to 8px top/bottom padding.
  2. Potential invalid CSS on non-hex custom tag colors.
- **Probable Root Cause:** Compact padding values copied from early prototype; naive hex string manipulation.
- **Recommended Correction:** Change `.notelist-card-item` padding to `10px 12px`; use `color-mix(in srgb, var(--tag-color) 12%, transparent)` for tag chips.
- **Verification Method:** Inspect DOM box model of note card; verify 10px vertical and 12px horizontal padding.

### Area 9: Editor and Toolbar
- **File:** `src/lib/components/layout/Toolbar.svelte` (lines 43–250), `src/lib/components/layout/Editor.svelte` (lines 510–565).
- **Target Requirement:** 36px toolbar height (`--toolbar-height: 36px`); grouped buttons; minimum 28px hit areas; active formatting state visibly distinct (`01_UI_DESIGN_SPECIFICATION.md`); top-left document anchor with 28–40px insets.
- **Actual Implementation:** Toolbar uses `h-10` (40px) instead of 36px. Style dropdown uses non-standard `h-6.5`. Most critically, toolbar buttons do NOT track or reflect active Tiptap formatting marks (Bold, Italic, Lists, etc. never highlight when cursor enters formatted text). Editor canvas correctly anchors top-left with 40px insets.
- **Exact Visual Discrepancy:** Toolbar buttons remain inert and static; users have no visual feedback on active formatting.
- **Probable Root Cause:** `Toolbar.svelte` only dispatches commands outward; it has no reactive bindings to Tiptap editor state or active marks.
- **Recommended Correction:**
  1. Pass active mark state (or editor instance) to `Toolbar.svelte` and bind active styling (`is-active` class with `--bg-card-active`).
  2. Adjust toolbar height to `h-[36px]`.
- **Verification Method:** Highlight bold text in editor; verify Bold icon displays active background and accent color.

### Area 10: Tab Bar
- **File:** `src/lib/components/layout/TabBar.svelte` (lines 80–191).
- **Target Requirement:** 36px height (`--tabbar-height: 36px`); active tab white/light card with 8px radius; conditional chevrons; pinned new tab button; no redundant sidebar toggles.
- **Actual Implementation:** Height is `h-9.5` (38px). When sidebar is collapsed, lines 86–96 inject an extra `PanelLeftOpen` button directly into the tab bar.
- **Exact Visual Discrepancy:** Tab bar displays an unwanted sidebar collapse icon that crowds the open tabs.
- **Probable Root Cause:** Defensive toggle button added to tab bar during earlier layout debugging.
- **Recommended Correction:** Remove lines 86–96 from `TabBar.svelte`; set height to `h-[36px]`.
- **Verification Method:** Collapse sidebar; confirm TabBar contains only tabs, conditional chevrons, and the new tab button.

### Area 11: Status Bar
- **File:** `src/lib/components/layout/StatusBar.svelte` (lines 19–108), `src/app.css` (lines 991–1000).
- **Target Requirement:** 26–30px height; floating capsule styling inset from panel edges; left group (Save, Words), right group (Ln/Col, Zoom, Wrap); non-overlapping at minimum widths.
- **Actual Implementation:** Floating pill capsule is correctly styled with `margin: 0 10px 10px`, `border-radius: 999px`, and `height: 30px`. However, neither group uses `min-width: 0` or truncation rules, causing controls to collide if editor width drops to 320px.
- **Exact Visual Discrepancy:** Controls crowd and can wrap awkwardly when editor panel is squeezed to its minimum width.
- **Probable Root Cause:** Fixed gap spacing without responsive visibility classes.
- **Recommended Correction:** Add `min-w-0` to groups and hide backlink counter on narrow widths (`hidden md:flex`).
- **Verification Method:** Drag editor panel to 320px width; confirm status bar contents remain cleanly aligned on a single row.

### Area 12: Settings Modal (Architecture & Geometry)
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 144–170).
- **Target Requirement:** 2-column modal (left category rail, right content pane); 16px radius; max height 85–90vh; comfortable padding; no massive empty dead space.
- **Actual Implementation:** Modal container line 146 hardcodes `h-[620px] max-h-[88vh]`. Because most categories only contain 150px–220px of content, the modal displays 400px–470px of empty white void (over 70% dead space) across General, Appearance, Editor, Storage, and About.
- **Exact Visual Discrepancy:** Huge, awkward empty void at the bottom of the modal in almost every category view.
- **Probable Root Cause:** Hardcoded `h-[620px]` class instead of flexible content-based sizing with min/max bounds.
- **Recommended Correction:** Change modal height to `min-h-[460px] max-h-[85vh] h-auto` or optimize category layout to balance vertical space.
- **Verification Method:** Open Settings across all 6 categories; verify dialog height adjusts naturally without barren voids.

### Area 13: General Settings
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 197–266).
- **Target Requirement:** Startup view configuration (All Notes, Pinned, Last Session); confirmation preferences; live auto-save info; persistent across sessions.
- **Actual Implementation:** UI cards render properly. However, `startupView`, `confirmTagDelete`, and `confirmPermanentDelete` are local component `$state` variables that are never saved to `appState` or `sessionService`. They reset to defaults upon closing the modal.
- **Exact Visual Discrepancy:** State changes revert immediately upon reopening the modal.
- **Probable Root Cause:** Mockup variables not wired to global session store.
- **Recommended Correction:** Add `startupView`, `confirmTagDelete`, `confirmPermanentDelete` to `appState.svelte.ts` and `SessionState`.
- **Verification Method:** Toggle confirmation checkboxes, close modal, reopen; confirm settings persist.

### Area 14: Appearance Settings
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 269–357).
- **Target Requirement:** 6 curated themes displayed in a 3-column × 2-row grid (`settings_target_layout.png`); functional interface density options.
- **Actual Implementation:** Theme cards are rendered in a 2-column grid (`sm:grid-cols-2`), stretching the cards vertically and departing from the target wireframe. The 5 preview dots touch the card bottom border. Interface density buttons change a local variable without affecting any application styles.
- **Exact Visual Discrepancy:**
  1. 2-column grid instead of approved 3-column grid.
  2. Preview swatches touch bottom border.
  3. Density buttons have zero visual effect on the app.
- **Probable Root Cause:** `grid-cols-2` used instead of `grid-cols-3`; missing density CSS token mappings.
- **Recommended Correction:** Update to `grid-cols-3 gap-3`; add padding below swatches; implement `data-density` token scaling.
- **Verification Method:** Compare against `settings_target_layout.png`.

### Area 15: Editor Settings
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 360–428).
- **Target Requirement:** Font size slider and presets; word wrap toggle; live preview box; cohesive lavender design system styling.
- **Actual Implementation:** Functionality works correctly. However, the `<input type="range">` uses unstyled browser-native controls, and content occupies only ~220px, leaving ~380px of blank space.
- **Exact Visual Discrepancy:** Plain raw OS slider track; massive empty void below preview box.
- **Probable Root Cause:** Missing custom range slider CSS classes.
- **Recommended Correction:** Style range slider track and thumb using `--accent` and `--radius-pill`.
- **Verification Method:** Inspect slider styling in WebKit and Chromium engines.

### Area 16: Storage Settings
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 431–485).
- **Target Requirement:** Vault location display with copy button; plain Markdown and SQLite 3 architecture explanation; clean text wrapping.
- **Actual Implementation:** Cards render clearly. Content occupies ~180px, leaving ~420px of dead space. Long vault paths use `break-all` without truncation or scroll containment.
- **Exact Visual Discrepancy:** Large empty space below cards.
- **Probable Root Cause:** Hardcoded modal height.
- **Recommended Correction:** Resolved when modal height is made flexible.
- **Verification Method:** Verify storage pane layout at 1366×768.

### Area 17: Keyboard Shortcuts
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 488–530).
- **Target Requirement:** Searchable, platform-aware list of registered shortcuts; grouped cleanly by section (`06_SETTINGS_AND_THEME_SPEC.md`).
- **Actual Implementation:** Shortcuts are presented in a flat table with repeating category tags (`NAVIGATION`, `NAVIGATION`, etc.) on every row. `Ctrl + F` is erroneously documented as "Search Notes" instead of "Find in Note" (`Ctrl + K` is search). Table leaves ~180px empty space.
- **Exact Visual Discrepancy:** Repetitive visual noise from duplicated tags on every row; inaccurate keybinding label.
- **Probable Root Cause:** Flat list data structure instead of sectioned hierarchy; documentation typo.
- **Recommended Correction:** Group shortcuts by category header; correct `Ctrl + F` label to "Find in Note".
- **Verification Method:** Search for "find" in shortcuts tab; confirm accurate mapping.

### Area 18: About Page
- **File:** `src/lib/components/modals/SettingsModal.svelte` (lines 532–560).
- **Target Requirement:** Version, build information, credits, license details.
- **Actual Implementation:** Displays app icon, v0.1.0 production badge, description, and stack badges. Leaves ~400px empty space below. Lacks clickable links for license or repo.
- **Exact Visual Discrepancy:** Static cards floating in upper portion of large modal.
- **Probable Root Cause:** Missing interactive links and flexible modal height.
- **Recommended Correction:** Add clickable license and repository links.
- **Verification Method:** Verify About tab layout.

### Area 19: Recently Deleted (Trash View)
- **File:** `src/lib/components/layout/NoteList.svelte` (lines 126–141, 228–254, 327–332).
- **Target Requirement:** "RECENTLY DELETED" header, note count, distinct red "Delete All" button; cards show "Deleted [date/time]"; explicit Restore and Delete Permanently actions; confirmation prompts.
- **Actual Implementation:** Header and card actions are implemented. However, in `after_recently_deleted_1366x768.png`, note cards display "Today" instead of "Deleted Today" or "Deleted [date]".
- **Exact Visual Discrepancy:** Deleted note cards lack the required "Deleted" prefix on their timestamp.
- **Probable Root Cause:** In `NoteList.svelte` line 291, `{note.is_trash ? ... : ...}` evaluated to false because mock notes in the test screenshot were not marked as trash (`is_trash: false`).
- **Recommended Correction:** Fix mock notes in `ipc.ts` to ensure trash filter returns true trash notes with `is_trash: true`.
- **Verification Method:** Navigate to Recently Deleted; confirm all cards display "Deleted [date/time]".

### Area 20: Theme Palette Dropdown (Quick Switcher)
- **File:** `src/lib/components/layout/TitleBar.svelte` (lines 187–243).
- **Target Requirement:** Compact popover launched from TitleBar; header "COLOR PALETTE LIBRARY", "6 themes"; 6 themes with accent dot, name, type, and 5 preview dots; selected checkmark (`current_theme_picker.png`).
- **Actual Implementation:** Line 190 sets `w-60` (240px). In `after_theme_picker_1366x768.png`, the 5th preview dot on Midnight, Forest, and Sunset is clipped in half by the container boundary. Header text touches the top curved edge. Selected theme lacks a checkmark icon.
- **Exact Visual Discrepancy:**
  1. Fifth color swatch dot is visibly cut off on multiple theme rows.
  2. Popover header text is pressed against the top rounded corner.
  3. No checkmark glyph on active theme.
- **Probable Root Cause:** `w-60` width is too narrow; header `py-1.5` inside `rounded-2xl` container lacks top padding; checkmark omitted from button template.
- **Recommended Correction:**
  1. Increase width to `w-72` (288px) or `w-[280px]`.
  2. Add `pt-2.5` to header.
  3. Add `<Check size={13} style="color: var(--accent);" />` to active theme row.
- **Verification Method:** Open theme picker; verify all 5 dots on all 6 rows have clear margin from border and active theme displays checkmark.

---

## 6. Source-Code Root Cause Analysis

### 1. Hardcoded CSS Hex Colors vs Semantic Tokens
- **Root Cause:** In `Sidebar.svelte` (lines 239, 256, 273, 290, 367, 515), navigation highlight classes were written as `bg-[#E4D1FA] text-[#2C1A4A]`. While this matches the lavender theme, it completely overrides the CSS variables `--bg-sidebar-active` and `--accent-text` defined for Midnight, Forest, Ocean, and Sunset.
- **Impact:** Selecting any folder, tag, or smart folder in a dark theme produces an inverted, high-glare light-lilac block that breaks theme coherence.

### 2. Transition Lag During Splitter Dragging
- **Root Cause:** In `routes/+page.svelte` (lines 189, 210), `transition-[width] duration-200 ease-in-out` is declared statically on the sidebar and note list panels.
- **Impact:** When the user clicks and drags the splitter handle, every pixel change emitted by `onMouseMove` triggers a 200ms interpolation curve, causing the splitter to fight the mouse cursor and lag severely.

### 3. Absolute Positioning Collision on Tag Rows
- **Root Cause:** In `Sidebar.svelte`, tag rows use flex `justify-between` placing note counts at the right edge, while the ellipsis action button is positioned with `absolute right-1.5 top-1/2 -translate-y-1/2`. Unlike folder rows, tag rows omit `group-hover/tag:opacity-0` on the count span.
- **Impact:** Moving the mouse over any tag row causes the three-dot icon to draw directly over the note count text (`... 2`).

### 4. Rigid Modal Height vs Dynamic Content
- **Root Cause:** In `SettingsModal.svelte` (line 146), `h-[620px]` forces the modal to a fixed 620px height regardless of the active tab's content requirements.
- **Impact:** General, Appearance, Editor, Storage, and About tabs suffer from 400px–470px of empty, unusable space.

### 5. Toolbar Decoupling from Editor Selection State
- **Root Cause:** `Toolbar.svelte` only invokes callbacks (`onCommand('bold')`) and does not subscribe to or receive Tiptap's `onSelectionUpdate` state.
- **Impact:** Toolbar buttons cannot query `editor.isActive('bold')`, leaving users with zero visual indication of active typography states.

### 6. Sub-Pixel and Padding Clipping in Popovers & Dialogs
- **Root Cause:** `w-60` (240px) in `TitleBar.svelte` is mathematically insufficient to accommodate:
  - Left padding (10px) + Accent dot (14px) + Gap (8px) + Label text (~100px) + Gap (8px) + 5 dots with gaps (5 × 6px + 4 × 2px = 38px) + Right padding (10px) = 188px content width minimum, which when localized or on high-DPI screens causes right-edge overflow.
- **Impact:** The 5th swatch dot is clipped in half by the container's right overflow boundary.

---

## 7. Conflicting Design Token Inventory

| Token / Property | `app.css` Declaration 1 | `app.css` Declaration 2 | Component Usage | Approved Specification | Resolution Required |
|---|---|---|---|---|---|
| `--editor-min-width` | `360px` (line 39) | `320px` (lines 688, 962) | `flex: 1 1 0%` | `360px` (`02_DESIGN_TOKENS.md`) | Remove `320px` override; enforce 360px |
| `--titlebar-height` | `38px` (line 40) | — | `h-11` (44px) in `TitleBar.svelte` | `38px` (`01_UI_DESIGN.md`) | Set `h-[38px]` on `TitleBar.svelte` |
| `--tabbar-height` | `36px` (line 41) | — | `h-9.5` (38px) in `TabBar.svelte` | `36px` (`01_UI_DESIGN.md`) | Set `h-[36px]` on `TabBar.svelte` |
| `--toolbar-height` | `36px` (line 42) | — | `h-10` (40px) in `Toolbar.svelte` | `36px` (`01_UI_DESIGN.md`) | Set `h-[36px]` on `Toolbar.svelte` |
| `--statusbar-height` | `28px` (line 43) | `30px` (lines 940, 992) | `h-[30px]` in `StatusBar.svelte` | `28–30px` floating capsule | Standardize on 30px capsule |
| Panel Header Heights | Unset | `min-height: 44px` (line 798) | Sidebar: 40px, NoteList: 44px, Tabs: 38px | Uniform alignment | Standardize to 44px across all 3 |
| Card Padding | `8px 10px` (line 817) | — | `notelist-card-item` | `10–12px` (`01_UI_DESIGN.md`) | Update to `10px 12px` |
| Sidebar Default Width | `240px` (line 31) | — | `210px` in `appState.svelte.ts` | `240px` (`02_DESIGN_TOKENS.md`) | Update store default to 240px |
| NoteList Default Width | `300px` (line 35) | — | `260px` in `appState.svelte.ts` | `300px` (`02_DESIGN_TOKENS.md`) | Update store default to 300px |

---

## 8. Prioritized Correction Plan

### Phase 2 Implementation Roadmap

#### Milestone 1: P0 — Critical Fixes (Immediate Architectural Safety)
1. **Fix Tag Row Count/Ellipsis Collision (`Sidebar.svelte`)**: Add `group-hover/tag:opacity-0 group-focus-within/tag:opacity-0` to note count span.
2. **Eliminate Hardcoded Lavender Hex in Navigation (`Sidebar.svelte`)**: Replace `bg-[#E4D1FA] text-[#2C1A4A]` with semantic `var(--bg-sidebar-active)` and `var(--accent-text)` to restore dark theme integrity.
3. **Fix Splitter Drag Stutter (`+page.svelte`)**: Conditionally disable transitions during active dragging with `class:transition-none={isDraggingSidebar || isDraggingNoteList}`.
4. **Fix Traffic Light Hit Targets (`TitleBar.svelte`)**: Wrap 10px traffic light dots in 24–28px transparent hit areas.
5. **Fix Edit Tag Dialog Button Boundary Touching (`Sidebar.svelte`)**: Restore bottom padding on modal footer to give "Save Changes" 16–20px clearance from rounded corner.

#### Milestone 2: P1 — High-Priority Spec Alignment & Layout Polish
1. **Fix Settings Modal Fixed Height & Dead Space (`SettingsModal.svelte`)**: Change `h-[620px]` to `min-h-[460px] max-h-[85vh] h-auto`.
2. **Implement Active Formatting Feedback in Toolbar (`Toolbar.svelte` & `Editor.svelte`)**: Wire Tiptap active marks (`editor.isActive(...)`) to toolbar buttons with active highlight tokens.
3. **Fix 5th Preview Dot Clipping in Theme Quick Switcher (`TitleBar.svelte`)**: Expand popover width from `w-60` to `w-72` and add active checkmark icon.
4. **Remove Redundant Sidebar Collapse Buttons (`TabBar.svelte` & `Sidebar.svelte`)**: Keep only the consolidated title bar toggle.
5. **Align Appearance Theme Cards Grid (`SettingsModal.svelte`)**: Switch from 2-column to 3-column × 2-row grid matching `settings_target_layout.png`.
6. **Harmonize Panel Header Heights (`app.css`, `Sidebar`, `NoteList`, `TabBar`)**: Standardize header height to 44px across all three panels.
7. **Persist Settings Options (`appState.svelte.ts`)**: Wire `startupView` and confirmation toggles into `SessionState`.

#### Milestone 3: P2 & P3 — Design Token Cleanup & Refinements
1. **Resolve Conflicting Tokens (`app.css`)**: Eliminate duplicate `--editor-min-width` declarations; align `--titlebar-height` and `--toolbar-height`.
2. **Increase Note Card Padding (`app.css`)**: Adjust `.notelist-card-item` padding to `10px 12px`.
3. **Fix Tag Chip Hex Opacity Concatenation (`NoteList.svelte`)**: Replace `${color}18` with CSS `color-mix`.
4. **Style Range Slider Track (`SettingsModal.svelte`)**: Implement custom slider styling for editor font size.
5. **Group Keyboard Shortcuts by Category (`SettingsModal.svelte`)**: Replace flat table with section headers.

---

## 9. Visual Regression Test Plan

Visual verification in Phase 2 must execute across the following matrix to prevent regressions:

### 1. Viewport Breakpoints
- **1280 × 720 (HD Laptop)**: Verify no horizontal window scrollbars; minimum editor width remains usable; status bar does not wrap into two lines.
- **1366 × 768 (Standard Laptop Baseline)**: Primary visual baseline. Verify 10px gutters, 16px panel radii, 12px card radii, and aligned header dividers.
- **1600 × 900 (Desktop Standard)**: Verify balanced editor reading canvas and status bar capsule centering.
- **1920 × 1080 (Full HD Widescreen)**: Verify document title and editor canvas remain anchored to top-left with 40px insets without centering drift.

### 2. State & Interaction Matrix
1. **Themes**: Capture workspace in all 6 themes (`warm-paper`, `midnight`, `forest`, `ocean`, `lavender`, `sunset`) to prove semantic token compliance.
2. **Navigation Selection**: Selected folder, selected tag, and selected smart folder across light and dark themes.
3. **Popovers & Overlays**:
   - TitleBar theme quick switcher open (verify 5 dots unclipped + checkmark).
   - Tag row action menu open (verify upward flip at bottom).
   - Edit Tag dialog open (verify button boundary margin).
   - Delete Tag confirmation open (verify safe default focus).
   - Settings modal across all 6 categories (verify zero dead space).
4. **Splitter Dragging**: Interactive drag test confirming 1:1 real-time cursor tracking without 200ms lag.
5. **Toolbar Interactivity**: Cursor in Bold, Italic, and Checklist blocks confirming active button highlights.

---

## 10. Known Limitations & Remaining Questions

1. **Native Window Chrome on Windows vs macOS Traffic Lights**: The application currently renders custom macOS-style traffic lights on the left side of the title bar inside Tauri frameless mode. On Windows 11 desktop installations, users may expect native Windows caption controls (minimize, maximize, close on the top right). The approved kit explicitly specifies the macOS-style traffic lights; this report audits against the approved specification.
2. **Automated Visual Snapshot Testing**: Currently, visual regression tests rely on headless Edge CDP screenshots. Integrating Playwright snapshot comparisons (`toHaveScreenshot()`) into CI/CD would automate pixel-diff detection.
3. **Interface Density Tokens**: The UI provides buttons for "Comfortable", "Compact", and "Spacious", but the design token system does not yet define mathematical multipliers for density scaling.

---
*End of Visual Fidelity Audit Report — Ready for Phase 2 Implementation Authorization.*

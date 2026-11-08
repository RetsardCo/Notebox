# 04 — Component Implementation & Refactoring

## 1. Scope & Component Architecture

This document details the refactoring, styling, and behavior of all primary and secondary application components in `src/lib/components/`.

---

## 2. Main Workspace Layout (`src/routes/+page.svelte`)

### Architecture
- **Three-Island Composition**:
  - Panel 1: `Sidebar.svelte` (width: default 240px, min 200px, max 380px)
  - Splitter 1: 10px draggable gutter with subtle illuminated handle
  - Panel 2: `NoteList.svelte` (width: default 300px, min 240px, max 480px)
  - Splitter 2: 10px draggable gutter
  - Panel 3: `Editor.svelte` (flex: 1 1 0%, min 360px)
- **Container**: `workspace-container` with 10px padding (`var(--workspace-gutter)`), 0 inner gap, and `var(--bg-canvas)` canvas background.
- **Panels**: `16px` border-radius (`var(--radius-panel)`), 1px solid `var(--border-subtle)`, `var(--shadow-panel)` shadow.

---

## 3. TitleBar (`src/lib/components/layout/TitleBar.svelte`)

- **Interactive macOS Traffic Lights**:
  - Close (Red: `#ff5f56`), Minimize (Yellow: `#ffbd2e`), Maximize/Restore (Green: `#27c93f`) with hover glyphs and active scale.
  - Full Tauri window integration via `@tauri-apps/api/window` (`close()`, `minimize()`, `toggleMaximize()`).
- **Brand & Active Document Info**:
  - Notebox application icon and bold brand text.
  - Active note breadcrumb with truncation.
- **Top-Right Quick Actions**:
  - Sidebar toggle (`PanelLeftClose` / `PanelLeftOpen`).
  - Note list column toggle (`Columns2`).
  - Word wrap toggle (`WrapText`).
  - **Color Palette Library**: Popover launcher with active swatch and palette icon. Opens 6-theme picker popover with 5 color preview dots per palette.
  - **Settings Action**: Single unified gear icon button opening `SettingsModal`.

---

## 4. Sidebar (`src/lib/components/layout/Sidebar.svelte`)

- **Header**: Clean capitalized `SIDEBAR` label with collapse button.
- **Search**: Integrated search input with `Ctrl+K` shortcut indicator, clear button, and debounced query execution.
- **Quick Access**:
  - All Notes (with total counter badge).
  - Pinned Notes.
  - Checklists (smart folder).
  - Recently Deleted (with live trash count).
- **Folders Section**:
  - Expandable folder tree with inline rename and delete controls.
  - "+ Add folder" action button with auto-focus inline creation input.
- **Tags Section**:
  - Tag rows with colored dot chips, note counter, and ellipsis action button (`...`).
  - Hover / focus-visible disclosure for tag actions.
  - "+ Add tag" action button with inline color swatch palette selector.
- **Redundancy Removal**: Redundant Settings and Theme picker buttons previously at the bottom-left of the sidebar have been permanently removed.

---

## 5. Notes List (`src/lib/components/layout/NoteList.svelte`)

- **Panel Header**: Current view title in uppercase tracking, note count, sort options (`Date Edited`, `Date Created`, `Title`), and "New Note" composer button.
- **Note Cards**:
  - Standardized 12px border radius (`var(--radius-card)`), 8px card gap.
  - Clean title truncation, 2-line preview snippet, date metadata ("Today", "Yesterday", or formatted date).
  - Folder pill tag and colored tag chips.
  - Active selection state with 1.5px `var(--border-card-active)` and elevated card shadow.
  - Right-click context menu (Pin/Unpin, Duplicate, Move to Trash, Lock Note).
- **Empty States**:
  - Regular view: Friendly prompt with quick "New Note" action.
  - Search view: "No matching notes" with filter clearing hint.
  - Recently Deleted view: Trash icon, "Trash is empty" message.

---

## 6. Editor (`src/lib/components/layout/Editor.svelte`)

- **Document Alignment**: Content aligned to top-left (`padding: 28px 40px 48px; transform-origin: top left;`) avoiding jarring center jump on wide displays.
- **Title & Metadata**:
  - Note title input with fluid auto-resize, -0.035em letter-spacing.
  - Document metadata line: formatted date, folder indicator, and estimated reading time ("X min read").
- **Tiptap Extensions**: Full preservation of StarterKit, Highlight, TaskList, TaskItem, Table, TableRow, TableHeader, TableCell, Image, Underline, and custom WikiLink extension.
- **Word Wrap Override**: Windows 11 Notepad-style horizontal panning mode via `.editor-no-wrap` container toggle.

---

## 7. Tab Bar (`src/lib/components/layout/TabBar.svelte`)

- **Active Tab Styling**: Distinct floating pill with white background (or palette equivalent), subtle border, and primary text color.
- **Tab Actions**:
  - Functional close button (`X`) with hover feedback and middle-click support.
  - Dirty dot indicator (`var(--accent)`) indicating unsaved modifications.
  - Long title truncation with ellipsis.
  - New scratch tab button (`+`).
- **Overflow & Scrolling**: Smooth horizontal scrolling via mouse wheel and responsive left/right chevron buttons when tabs exceed viewport width.

---

## 8. Toolbar (`src/lib/components/layout/Toolbar.svelte`)

- **Formatting Controls**: Style dropdown (`Paragraph`, `H1`, `H2`, `H3`), Bold, Italic, Underline, Strikethrough, Highlight.
- **Lists & Structures**: Checklist, Bullet List, Numbered List, Insert Table, Insert Image, Blockquote, Code Block, Horizontal Divider.
- **Utility Actions**: Word Wrap toggle, Find & Replace toggle, Pin toggle, Password Lock toggle, Share & Export button.

---

## 9. Status Bar (`src/lib/components/layout/StatusBar.svelte`)

- **Floating Status Capsule**: Pill border radius (`999px`), subtle border, 30px height, inset horizontal margins.
- **Indicators**:
  - Live save status: Saved (green check), Saving (amber spinner), Unsaved (amber dot).
  - Word count with singular/plural formatting.
  - Backlink counter (when incoming links exist).
  - Cursor position: `Ln X, Col Y`.
  - Zoom controls: `-`, current zoom percentage (click to reset to 100%), `+`.
  - Word Wrap toggle indicator (`Wrap: On / Off`).

---

## 10. Secondary Dialogs & Modals

1. **PasswordModal (`src/lib/components/modals/PasswordModal.svelte`)**:
   - 16px modal radius, backdrop blur, AES-256 password setup, unlock verification, and lock removal.
2. **ExportModal (`src/lib/components/modals/ExportModal.svelte`)**:
   - 16px modal radius, card options with `var(--bg-card)` for Markdown, Plain Text, HTML Document, and Print / PDF.
3. **FindReplace (`src/lib/components/layout/FindReplace.svelte`)**:
   - Integrated floating toolbar panel with Find Next/Prev, Replace, Replace All, and match navigation.

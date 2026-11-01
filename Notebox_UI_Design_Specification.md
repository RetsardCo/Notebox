# NOTEBOX — COMPLETE UI DESIGN SPECIFICATION
**Reference Document**: `Notebox_UI_Design_Specification.md`  
**Target Design System**: Three-Island macOS-Inspired Native Desktop  
**Date**: November 1, 2026  
**Author**: Principal Design Systems Architect & Senior Desktop Frontend Engineer  

---

## 1. Global Layout Architecture & Design Tokens

### 1.1 Canvas & Workspace Dimensions

```css
:root {
  /* Workspace Canvas & Gutters */
  --workspace-gutter: 10px;
  --panel-gutter: 10px;
  --panel-radius: 16px;
  --panel-border: 1px solid var(--border-subtle);
  --panel-shadow: 0 2px 10px rgba(44, 26, 74, 0.05);

  /* Component Radii */
  --radius-panel: 16px;
  --radius-card: 12px;
  --radius-pill: 9999px;
  --radius-input: 10px;
  --radius-button: 8px;
  --radius-tab: 8px;

  /* Typography Scales */
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, "Cascadia Code", "Courier New", monospace;
}
```

### 1.2 Color System (Lavender Theme - Reference A Exact Tokens)

```css
[data-theme="lavender"] {
  /* Canvas & Windows */
  --bg-window: #FAF5FB;
  --bg-canvas: #ECE0F8;
  --bg-titlebar: #FAF5FB;

  /* Island Panels */
  --bg-sidebar: #F5EFFD;
  --bg-notelist: #F4EBFB;
  --bg-editor: #FBF7FE;
  --bg-tabbar: #EEE4F8;
  --bg-toolbar: #F8F4FD;
  --bg-statusbar: #F4EDFC;
  --bg-modal: #FAF5FB;

  /* Cards & Inputs */
  --bg-card: #FCF8FE;
  --bg-card-hover: #F8F1FD;
  --bg-card-active: #F1E8FA;
  --border-card-active: #9D76F5;
  --bg-input: #F8F2FD;
  --bg-tab-active: #FFFFFF;
  --border-tab-active: #DDD3EE;

  /* Text & Accents */
  --text-primary: #1E1233;
  --text-secondary: #5A4B70;
  --text-tertiary: #8B7D9E;
  --accent: #8A4EF5;
  --accent-light: #E4D1FA;
  --accent-hover: #793DE3;
  --accent-text: #2C1A4A;

  /* Borders & Dividers */
  --border: #DDD3EE;
  --border-subtle: #E6DCF5;
}
```

---

## 2. Component Specifications

### 2.1 Window Title Bar
- **Height**: `38px`
- **Background**: `var(--bg-titlebar)` (`#FAF5FB`)
- **Border Bottom**: `1px solid var(--border-subtle)`
- **macOS Controls**: Positioned at `X=16px`, `Y=14px`, `10px` diameter with `6px` inter-dot spacing.
  - Close: `#FF5F56`
  - Minimize: `#FFBD2E`
  - Maximize: `#27C93F`
- **Application Identity**:
  - Icon: `18 × 18px` rounded square.
  - Name: `Notebox`, `12px` font-size, font-weight `600`, color `var(--text-primary)`.
- **Document Title**:
  - Position: Horizontally centered in window.
  - Text: `{Note Title} — Notebox` (or `Notebox` when no note active).
  - Font: `11.5px`, font-weight `500`, color `var(--text-secondary)`.
- **Right Header Controls**:
  - `28 × 28px` action buttons, `gap: 6px`, `text-[var(--text-secondary)] hover:text-[var(--text-primary)]`.

---

### 2.2 Sidebar Panel (Island 1)
- **Geometry**:
  - Minimum width: `200px`, default width: `220px`, max width: `380px`.
  - Outer margins: `10px` top, `10px` bottom, `10px` left.
  - Border radius: `16px`.
  - Background: `var(--bg-sidebar)`.
  - Border: `1px solid var(--border-subtle)`.
  - Shadow: `var(--panel-shadow)`.
- **Internal Spacing**:
  - Top header: `h-11 px-3.5 flex items-center justify-between`.
  - Section label: `px-3.5 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]`.
- **Search Field**:
  - Outer box: `h-8.5 px-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] flex items-center gap-2`.
  - Placeholder: `Search notes...`, font-size `11.5px`, color `var(--text-tertiary)`.
  - Shortcut badge: `Ctrl K` in `px-1.5 py-0.5 rounded text-[10px] font-mono bg-black/5 dark:bg-white/10`.
- **Navigation & Folder Rows**:
  - Row height: `32px` (`h-8`).
  - Radius: `10px` (`rounded-xl`).
  - Active pill: `bg-[#E4D1FA] text-[#2C1A4A] font-semibold`.
  - Inactive row: `text-[var(--text-secondary)] hover:bg-black/5 dark:hover:bg-white/5`.
  - Icon size: `14px`.
  - Badge counter: `text-[11px] font-medium text-[var(--text-tertiary)]`.
- **Bottom Settings**:
  - Anchored at bottom with `p-3 border-t border-[var(--border-subtle)]`.

---

### 2.3 Notes List Panel (Island 2)
- **Geometry**:
  - Minimum width: `250px`, default width: `280px`, max width: `480px`.
  - Gutter between sidebar & notes list: `10px` (splitter handle acts as the 10px gutter).
  - Border radius: `16px`.
  - Background: `var(--bg-notelist)`.
  - Border: `1px solid var(--border-subtle)`.
  - Shadow: `var(--panel-shadow)`.
- **Header Bar**:
  - Height: `44px` (`h-11`).
  - Padding: `px-3.5`.
  - Title: View name in `11px` bold uppercase (`var(--text-primary)`).
  - Subtitle: Note count (`8 notes`) in `10.5px` (`var(--text-tertiary)`).
  - Action buttons: Sort dropdown and compose button (`28 × 28px`).
- **Cards Container**:
  - Internal padding: `10px` around all sides.
  - Card vertical gap: `8px`.
  - Scrollbar: Subtle macOS-style overlaid scrollbar.
- **Note Cards**:
  - Inactive card: `background: #FCF8FE; border: 1px solid #ECE4F7; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);`.
  - Active card: `background: #F1E8FA; border: 1.5px solid #9D76F5; border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(157, 118, 245, 0.15);`.
  - Note Title: `12px` font-size, font-weight `600`, color `var(--text-primary)`, `line-clamp-1`.
  - Note Snippet: `11px` font-size, color `var(--text-secondary)`, line-height `1.5`, `line-clamp-2`.
  - Bottom row: Date (`Today`) on left (`10.5px`, `var(--text-tertiary)`), Folder badge on right (`px-2 py-0.5 rounded-md bg-[#F3EAF8] text-[#6D5591] font-medium text-[10px]`).
  - **Card Hover Action**: Subtle hover delete button on card trailing edge allowing instant note deletion.

---

### 2.4 Editor Panel (Island 3)
- **Geometry**:
  - Flex: `1 1 auto` (occupies remaining width, min-width `360px`).
  - Outer margins: `10px` top, `10px` bottom, `10px` right.
  - Border radius: `16px`.
  - Background: `var(--bg-editor)` (`#FBF7FE`).
  - Border: `1px solid var(--border-subtle)`.
  - Shadow: `var(--panel-shadow)`.

#### 2.4.1 Tab Bar
- **Height**: `36px` (`h-9`).
- **Background**: `var(--bg-tabbar)` (`#EEE4F8`).
- **Border Radius**: Top-left and top-right `16px` to match island contour.
- **Chevrons**: `<` and `>` chevron buttons displayed when tabs overflow container.
- **Active Tab**:
  - `background: #FFFFFF; border: 1px solid #DDD3EE; border-radius: 8px; height: 28px; padding: 0 10px; font-weight: 600; font-size: 11.5px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);`.
  - Close `×` button: Always visible, `14 × 14px`, hover effect `bg-black/10 rounded`.
- **Inactive Tabs**:
  - `height: 28px; padding: 0 10px; font-size: 11.5px; color: var(--text-secondary);`.
  - Close `×` button: Visible on hover or when active.

#### 2.4.2 Editor Toolbar
- **Height**: `34px` (`h-8.5`).
- **Background**: `var(--bg-toolbar)` (`#F8F4FD`).
- **Border Bottom**: `1px solid var(--border-subtle)`.
- **Padding**: `px-3`.
- **Style Selector**: Compact rounded pill (`h-6.5 text-[11px] font-semibold rounded-lg px-2.5 mr-1.5 bg-[#F3ECFB] border border-[#DDD2EE]`).
- **Tools**: `24 × 24px` icon buttons, `gap: 4px` within groups, `w-px h-3.5 bg-[var(--border-subtle)]` between groups.

#### 2.4.3 Content Container (Windows 11 Notepad Alignment)
- **Positioning**: **Top-Left Anchored**.
  - `margin-inline: 0` (no horizontal centering!).
  - `padding: 28px 40px 48px;`.
  - `transform-origin: top left;`.
- **Document Title**:
  - Text input: `w-full text-2xl font-bold tracking-tight bg-transparent border-none outline-none mb-1.5 text-[var(--text-primary)]`.
- **Metadata Line**:
  - `px-0.5 mb-3 flex items-center gap-2 text-xs font-medium text-[var(--text-tertiary)]`.
- **Subtle Divider**:
  - `border-b border-[var(--border-subtle)] mb-5`.
- **Body Content (ProseMirror)**:
  - Font size: `14px`, line-height `1.7`, color `var(--text-primary)`.
  - **Word Wrap Off Behavior**:
    ```css
    .editor-no-wrap .ProseMirror,
    .editor-no-wrap .ProseMirror p {
      white-space: pre !important;
      word-break: normal !important;
      overflow-wrap: normal !important;
      width: max-content !important;
      min-width: 100% !important;
    }
    ```

#### 2.4.4 Status Bar
- **Height**: `26px` (`h-6.5`).
- **Background**: `var(--bg-statusbar)` (`#F4EDFC`).
- **Border Top**: `1px solid var(--border-subtle)`.
- **Border Radius**: Bottom-left and bottom-right `16px` to match island contour.
- **Controls**:
  - Left: Save status (`✓ Saved`), word count.
  - Right: Cursor position (`Ln X, Col Y`), Zoom percentage (`— 100% +`), Word wrap toggle (`Wrap: Off` / `Wrap: On`).

---

### 2.5 Modals & Overlays (Cross-Panel Consistency)

#### Settings Modal, Export Modal, Password Modal
- **Container**:
  - Max-width: `480px` (Settings), `384px` (Export/Password).
  - Background: `var(--bg-modal)` (`#FAF5FB`).
  - Border: `1px solid var(--border)`.
  - Border Radius: `16px` (`rounded-2xl`).
  - Shadow: `0 20px 40px -15px rgba(44, 26, 74, 0.25)`.
  - Internal Padding: `20px` (`p-5`).
  - Section dividers: `border-t border-[var(--border-subtle)] pt-3.5 space-y-2.5`.
- **Interactive Elements**:
  - Palette preview cards: `rounded-xl p-3 border border-[var(--border-subtle)] bg-[var(--bg-input)] hover:border-[var(--accent)]`.
  - Buttons: `rounded-lg px-3 py-1.5 text-xs font-semibold`.

---

## 3. Responsive Scaling & Window Breakpoints

| Window Width | Sidebar Behavior | Notes List Behavior | Editor Behavior | Workspace Gutter |
|---|---|---|---|---|
| **>= 1280px** | Default: `220px` (resizable `200–380px`) | Default: `280px` (resizable `250–480px`) | Flex-1 (`>= 600px`) | `10px` |
| **1100–1279px** | Compact: `200px` | Compact: `250px` | Flex-1 (`>= 500px`) | `10px` |
| **820–1099px** | Collapsible (defaults to hidden or `180px`) | `240px` | Flex-1 (`>= 400px`) | `8px` |
| **< 820px** | Collapsed by default (drawer) | `220px` or full width | Single-panel focused | `6px` |

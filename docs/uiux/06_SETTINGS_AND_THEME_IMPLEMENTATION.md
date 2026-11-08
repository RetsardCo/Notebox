# 06 — Settings Architecture & Theme Implementation

## 1. Overview & Objectives

1. **Two-Column Settings Architecture**: Refactor `SettingsModal.svelte` from an unorganized dialog into a clear 2-column modal with a left navigation rail and right content pane.
2. **Six Distinct Sections**:
   - **General**: Startup view, safety confirmations, live auto-save indicators.
   - **Appearance**: Color theme grid (6 themes with interactive swatches), interface density segment (`Comfortable`, `Compact`, `Spacious`).
   - **Editor**: Font family, font size, line height, tab size, spellcheck, word wrap default.
   - **Storage**: Vault directory path with "Copy Path" and "Reveal in File Explorer" actions, note count and folder count statistics.
   - **Shortcuts**: Interactive searchable shortcut reference categorized by Navigation, Search, Formatting, and View & App.
   - **About**: Version information, developer credits, licenses, repository link, release notes.
3. **Consolidated Global Access**: Redundant settings and theme toggles were eliminated from the sidebar, creating two unified access points in `TitleBar.svelte`:
   - Single Settings gear button opening `SettingsModal`.
   - Single Color Palette Library button opening the quick-switcher popover.
   - Both access points share identical state in `appState` and persist to SQLite.

---

## 2. Settings Modal Layout (`SettingsModal.svelte`)

### 2.1 Navigation Rail
The left column (`w-48`) houses 6 category buttons with icons:
- `Sliders` -> General
- `Palette` -> Appearance
- `Type` -> Editor
- `HardDrive` -> Storage
- `Keyboard` -> Shortcuts
- `Info` -> About

Active items receive an active pill styling (`bg-[var(--bg-sidebar-active)]` and text `var(--accent-text)`).

### 2.2 Content Panes Detail
- **General**: Default view segmented control (`All Notes`, `Pinned Notes`, `Last Session`), safety checkboxes for tag deletion and permanent deletion, auto-save status.
- **Appearance**: 2x3 responsive grid displaying all 6 themes (`Warm Paper`, `Midnight`, `Forest`, `Ocean`, `Lavender`, `Sunset`) with their primary accent color, dark/light type badge, description, and 5-dot color swatches. Clicking any card calls `appState.setTheme(...)` with immediate full-app theme propagation.
- **Editor**: Controls for typography selection (System Sans, SF Pro, Inter, Monospace), font size stepper (12px–20px), line height, and editing behaviors.
- **Storage**: Clean read-only input for the vault path with a "Copy Path" button (shows "Copied!" toast feedback for 2s) and system explorer integration.
- **Shortcuts**: Real-time search filter filtering over 20 registered shortcuts across Navigation, Search, Formatting, and System.
- **About**: Brand logo, Notebox version 0.1.0, MIT License, and GitHub repository links.

---

## 3. Theme Quick-Switcher (`TitleBar.svelte`)

- **Anchor**: Top-right corner of the window title bar.
- **Interaction**:
  - Clicking the palette icon opens a floating popover card (`w-60 rounded-2xl border shadow-xl p-2 z-50 backdrop-blur-md`).
  - Lists all 6 themes with accent dots, name, theme type, and 5-dot color swatches.
  - Active theme is highlighted with an active pill background.
  - Clicking outside closes the popover via `<svelte:window onclick={...}>`.

---

## 4. Visual Verification Proof

- `docs/uiux/screenshots/after/after_theme_picker_1366x768.png`: Demonstrates the TitleBar quick-switcher popover in action.
- `docs/uiux/screenshots/after/after_settings_general_1366x768.png`: General settings pane.
- `docs/uiux/screenshots/after/after_settings_appearance_1366x768.png`: Appearance settings pane with 6 theme cards and density selector.
- `docs/uiux/screenshots/after/after_settings_editor_1366x768.png`: Editor preferences pane.
- `docs/uiux/screenshots/after/after_settings_storage_1366x768.png`: Storage and vault inspection pane.
- `docs/uiux/screenshots/after/after_settings_shortcuts_1366x768.png`: Keyboard shortcuts reference list.
- `docs/uiux/screenshots/after/after_settings_about_1366x768.png`: Application details and version metadata.

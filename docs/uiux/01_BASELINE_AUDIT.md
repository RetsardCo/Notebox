# 01 — Baseline Audit and Technical Inspection

**Project:** Notebox Desktop Application  
**Repository Path:** `D:\Antigravity\scratch\noteflow` (Junction: `C:\Users\Kurados\.gemini\antigravity\scratch\noteflow`)  
**Active Branch:** `feature/ui-refined-package`  
**Date:** November 2026  
**Auditor:** Principal UI/UX Designer & Senior Svelte 5 / Systems Engineer  

---

## 1. Technical Stack Inventory

| Component / Layer | Technology & Version | Configuration File | Notes |
|---|---|---|---|
| **Frontend Framework** | Svelte 5 (`^5.56.3`) | `svelte.config.js` | Uses Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`). |
| **Meta-Framework** | SvelteKit (`^2.65.1`) | `svelte.config.js` | Configured with `@sveltejs/adapter-static` for Tauri single-page app packaging. |
| **CSS & Design System** | Tailwind CSS v4 (`^4.3.3`) | `@tailwindcss/vite` (`^4.3.3`) in `vite.config.js` | Tailwind v4 uses CSS-first configuration (`@import "tailwindcss";` in `src/app.css`). |
| **Language & Typings** | TypeScript (`~6.0.3`) | `tsconfig.json` | Strict typechecking enabled. |
| **Desktop Framework** | Tauri v2 (`^2`) | `src-tauri/tauri.conf.json` | Frameless desktop window with custom drag region and window controls. |
| **Backend Core** | Rust (2021 Edition) | `src-tauri/Cargo.toml` | Rusqlite with WAL mode and foreign keys enabled; AES-GCM / Argon2id crypto. |
| **Database** | SQLite 3 | `src-tauri/src/db/` | `notebox.db` located inside `.notebox` directory in user's vault folder. |
| **Rich Text Editor** | Tiptap Core v3 (`^3.32.2`) | `src/lib/components/layout/Editor.svelte` | Extensions: StarterKit, Table, TaskList, TaskItem, Image, Highlight, Underline. |
| **Test Framework** | Vitest (`^5.0.5`) | `package.json` | 5 test suites covering layout math, zoom isolation, zoom stress, and markdown. |

---

## 2. Baseline Quality Checks & Verification Results

All checks were executed against the pristine baseline repository before applying modifications:

### 2.1 Svelte & TypeScript Diagnostics (`svelte-check`)
- **Command:** `npm run check` (`svelte-kit sync && svelte-check --tsconfig ./tsconfig.json`)
- **Result:** **PASSED (0 errors, 0 warnings)**
- **Diagnostics Output:**
  ```text
  Loading svelte-check in workspace: c:\Users\Kurados\.gemini\antigravity\scratch\noteflow
  Getting Svelte diagnostics...
  svelte-check found 0 errors and 0 warnings
  ```

### 2.2 Frontend Unit & Integration Tests (`vitest`)
- **Command:** `npm run test` (`vitest run`)
- **Result:** **PASSED (5 test files, 129 tests passed, 0 failures)**
- **Test Summary:**
  - `src/lib/utils/layout.test.ts` (12 tests passed)
  - `src/lib/utils/zoom.test.ts` (31 tests passed)
  - `src/lib/utils/markdown.test.ts` (13 tests passed)
  - `src/lib/utils/zoom.stress.test.ts` (55 tests passed)
  - `src/lib/utils/zoom-isolation.test.ts` (18 tests passed)
  - Duration: 4.38s

### 2.3 Rust Native Backend Tests (`cargo test`)
- **Command:** `cargo test` (in `src-tauri`)
- **Result:** **PASSED (10 tests passed, 0 failures)**
- **Backend Test Summary:**
  - `test_crypto_hashing_and_verification`: ok
  - `test_session_state_json_roundtrip`: ok
  - `test_crypto_encryption_and_decryption_with_random_nonces`: ok
  - `test_database_initialization_and_seeding`: ok
  - `test_checklist_smart_folder_filtering`: ok
  - `test_welcome_note_body_starts_with_media_banner`: ok
  - `test_sync_checklist_flags_backfill`: ok
  - `test_trash_auto_purge`: ok
  - `test_legacy_vellum_db_and_session_migration`: ok
  - `test_legacy_noteflow_db_and_session_migration`: ok

### 2.4 Production Static Build (`vite build`)
- **Command:** `npm run build`
- **Result:** **PASSED (Built in 13.62s + 28.93s, wrote site to `build/`)**
- **Critical Path Environment Note:**
  `C:\Users\Kurados\.gemini\antigravity\scratch` is an NTFS directory junction pointing to `D:\Antigravity\scratch`. When executing Vite/Rolldown through the junction path `C:\...`, Rolldown's module path normalization detects an external path mismatch (`D:/...` vs `C:/...`). Running the build from the canonical physical path `D:\Antigravity\scratch\noteflow` completely avoids this Windows filesystem junction issue and finishes with 0 errors.

---

## 3. Baseline Visual Evidence

Baseline screenshots were captured of the live application running in the headless Chromium environment:

1. **1920 × 1080 Standard Desktop Baseline:**
   - Path: `docs/uiux/screenshots/baseline/baseline_1920x1080.png`
   - File Size: ~66 KB
2. **1366 × 768 Compact Desktop Baseline:**
   - Path: `docs/uiux/screenshots/baseline/baseline_1366x768.png`
   - File Size: ~62 KB

---

## 4. Discrepancy & Root Cause Analysis

Comparing the current baseline against `target_main_ui.png`, `settings_target_layout.png`, `tag_management_target.png`, and the authoritative specifications:

### 4.1 Global Settings & Theme Controls Redundancy
- **Current Observation:** The sidebar renders a bottom floating card containing a "Settings" button and a theme palette color dot button. Meanwhile, `TitleBar.svelte` also provides a Settings button and a Color Palette Library switcher popover in its top-right corner.
- **Root Cause:** Duplicated access points causing UI clutter in the navigation column.
- **Target Direction:** Under the user's latest decision, remove the bottom-left footer card from `Sidebar.svelte`. The TitleBar top-right buttons are verified as fully functional and serve as the single, authoritative entry points for Settings and theme switching.

### 4.2 Tag Management Limitations
- **Current Observation:** In `Sidebar.svelte`, the Tags section only allows creating a tag (name + color) and filtering notes by clicking a tag row. There is no way to edit tag names, change colors after creation, or delete tags from the UI.
- **Backend State:** `src-tauri/src/commands/tags.rs` has `get_tags`, `create_tag`, and `delete_tag`, but lacks `update_tag`. `src/lib/services/ipc.ts` lacks `updateTag`.
- **Target Direction:**
  1. Add `update_tag` to Rust backend with name validation (non-empty, duplicate rejection) and color update.
  2. Add `updateTag` to `ipc.ts` and `appState.svelte.ts`.
  3. Add an interactive overflow menu (`...`) on each tag row in `Sidebar.svelte` with:
     - **Edit tag name:** preserves tag ID and note associations.
     - **Change color:** curated swatch picker, persists to DB and updates dots/chips.
     - **Delete tag:** shows safe confirmation stating notes will NOT be deleted, only tag associations; if the deleted tag was active, clears active filter.

### 4.3 Settings Modal Information Architecture
- **Current Observation:** `SettingsModal.svelte` displays a single long scrollable column with Theme Palettes, Vault Path, Font Size Slider, Keyboard Shortcuts, and About.
- **Target Direction:** Refactor into a 2-pane desktop modal matching `settings_target_layout.png`:
  - **Left Navigation Rail:** General, Appearance, Editor, Storage, Shortcuts, About.
  - **Right Content Area:** Categorized sections with consistent spacing, clear titles, and refined form controls.
  - Proper keyboard accessibility, focus trap, and Escape dismissal.

### 4.4 Recently Deleted Actions & Metadata
- **Current Observation:** In `NoteList.svelte`, notes in trash show standard "Today" / date metadata and only display a hover trashcan icon.
- **Target Direction:**
  - Header displays "Recently Deleted" with note count and "Delete All" action (with confirmation dialog).
  - Note cards show explicit "Deleted [date/time]" metadata.
  - Quick action area includes explicit **Restore** (`RotateCcw`) and **Delete Permanently** (`Trash2`) buttons.
  - Empty state clearly explains that deleted notes can be restored until permanently purged.
  - Restore handles orphan notes whose folders were deleted by resetting `folder_id` to null.

### 4.5 Tabs, Toolbar, and Editor Insets
- **Current Observation:** Tabs, Toolbar, and Editor have good functional foundations from prior work. Refinements are needed to ensure:
  - Active tab has high-contrast card styling with persistent close button.
  - Toolbar groups have proper dividers and minimum 28px hit targets.
  - Editor document container is top-left anchored with 28-40px horizontal padding.
  - Word wrap toggle reliably enforces CSS wrapping rules.

---

## 5. Baseline Audit Conclusion

The codebase is clean, well-typed, and structurally sound:
- Zero typecheck errors.
- 100% test pass rate across both Rust and Vitest suites.
- Production build succeeds cleanly in canonical path.
- The path forward is a clear, systematic implementation of the required UI/UX redesign phases without breaking existing data or functionality.

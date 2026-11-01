# Project: noteflow (Zoom Controls & Layout Spacing Hierarchy)

## Architecture
- **Framework & Runtime**: SvelteKit 2 SPA mode on Svelte 5 (with Runes), Vite 8, Tauri v2 (Rust backend).
- **Styling**: Tailwind CSS v4 with central 4px design token system (`src/app.css`).
- **Editor**: TipTap v3 rich text editor mounted in `Editor.svelte` with ProseMirror content.
- **State Flow**: Reactive store `appState.svelte.ts` manages active note, layout dimensions, theme, and zoom state.
- **Event Flow**: Window & component event listeners handle shortcuts, mouse scroll wheel, and splitter dragging.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Ctrl+Scroll Zoom Up | Holding Ctrl and scrolling mouse wheel up enlarges editor note text | M1 | ORIGINAL_REQUEST §R1 |
| 2 | Ctrl+Scroll Zoom Down | Holding Ctrl and scrolling mouse wheel down shrinks editor note text | M1 | ORIGINAL_REQUEST §R1 |
| 3 | Zoom Boundaries | Enforce standard min/max limits (10% min, 500% max, 10% steps) | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Ctrl+0 Reset Shortcut | Pressing Ctrl+0 resets editor zoom level to default (100%) | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Zoom UI Isolation | Zoom applies strictly to note text; scrollbars and surrounding panels remain 100% | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Workspace Gutter (10px) | 10px breathing room frame around panels over `--bg-canvas` like Windows Notepad | M2 | ORIGINAL_REQUEST §R2 |
| 7 | Panel-to-Panel Gutter (10px) | 10px gap between Sidebar, NoteList, and Editor with freestanding rounded card panels | M2 | ORIGINAL_REQUEST §R2 |
| 8 | Sidebar Horizontal Padding (12px) | Standardize all sidebar items and footer to 12px (`px-3`) horizontal padding | M2 | ORIGINAL_REQUEST §R2 |
| 9 | Notes Panel Padding (10px) | Unify header, card container, and trash footer to 10px (`px-2.5`) padding | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Note Card & Toolbar Alignment | Verify card padding (10-12px), card gap (6-8px), toolbar padding (12-16px) | M2 | ORIGINAL_REQUEST §R2 |
| 11 | Editor Content Padding | Verify editor horizontal padding (32-40px) and top padding (24-32px) | M2 | ORIGINAL_REQUEST §R2 |
| 12 | Section Spacing (16-20px) | Standardize section vertical spacing across panels to 16-20px | M2 | ORIGINAL_REQUEST §R2 |
| 13 | Explicit Button Padding | Provide explicit horizontal padding for status bar and panel buttons | M2 | ORIGINAL_REQUEST §R2 |
| 14 | Automated Test Suite | Unit tests for zoom utilities, layout tests, zero regressions in existing tests | M3 | ORIGINAL_REQUEST §Verification |
| 15 | Adversarial Verification | Stress-testing zoom clamping, wheel sensitivity, layout overflow, and boundary checks | M3 | ORIGINAL_REQUEST §Verification |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Editor Text Zoom & Shortcuts | Implement zoom utility module, wheel event handler in Editor, Ctrl shortcuts, boundary enforcement, zoom reset, and unit tests | none | DONE |
| M2 | Layout Spacing & Padding Alignment | Implement 10px workspace & panel gutters in `+page.svelte`, update splitter math, standardize sidebar 12px & notes 10px padding, section spacing, and button padding | M1 | DONE |
| M3 | Final Verification & Coverage Hardening | Run all test suites (Vitest, svelte-check, vite build, cargo test), conduct adversarial stress testing across all acceptance criteria | M2 | DONE |

## Interface Contracts
### `src/lib/utils/zoom.ts` ↔ Components (`Editor.svelte`, `+page.svelte`, `StatusBar.svelte`)
```ts
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 500;
export const DEFAULT_ZOOM = 100;
export const ZOOM_STEP = 10;

export function clampZoom(zoom: number): number;
export function zoomIn(currentZoom: number): number;
export function zoomOut(currentZoom: number): number;
export function resetZoom(): number;
export function handleZoomWheel(event: WheelEvent, currentZoom: number): { handled: boolean; newZoom: number };
export function handleZoomKey(event: KeyboardEvent, currentZoom: number): { handled: boolean; newZoom: number };
```

### `appState.svelte.ts` Zoom API
```ts
zoomLevel: number; // reactive state, defaults to 100
zoomIn(): void;
zoomOut(): void;
resetZoom(): void;
setZoomLevel(level: number): void;
```

### Layout Hierarchy Contract
- `main` element in `src/routes/+page.svelte`: `p-[10px] gap-[10px]` over `--bg-canvas`.
- Panels (Sidebar, NoteList, Editor): `rounded-[12px] border border-[var(--border-subtle)] overflow-hidden`.
- Splitters: centered in 10px gutter; drag math: `e.clientX - 10`.

## Code Layout
- `src/lib/utils/zoom.ts`: Pure zoom math, bounds clamping, wheel & keyboard event handling.
- `src/lib/utils/zoom.test.ts`: Automated unit tests for zoom logic.
- `src/lib/utils/layout.test.ts`: Automated tests asserting layout spacing constants and component classes.
- `src/lib/stores/appState.svelte.ts`: Central reactive store managing application state.
- `src/lib/components/layout/Editor.svelte`: TipTap editor container, wheel event handling, zoom CSS styling.
- `src/routes/+page.svelte`: Main window layout, gutters, splitters, global keyboard shortcuts.
- `src/lib/components/layout/Sidebar.svelte`: Navigation sidebar, folders, tags, settings.
- `src/lib/components/layout/NoteList.svelte`: Middle panel note cards list.
- `src/lib/components/layout/StatusBar.svelte`: Footer status bar with zoom percentage and wrap buttons.
- `src/lib/components/layout/Toolbar.svelte`: Editor rich text formatting toolbar.

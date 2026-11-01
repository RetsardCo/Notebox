# E2E Test Infra: noteflow

## Test Philosophy
- Opaque-box, requirement-driven.
- Methodology: Category-Partition + BVA + Pairwise + Workload Testing.

## Feature Inventory
| # | Feature | Source (requirement) | Tier 1 | Tier 2 | Tier 3 |
|---|---------|---------------------|:------:|:------:|:------:|
| 1 | Ctrl+Scroll Zoom In | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 2 | Ctrl+Scroll Zoom Out | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 3 | Zoom Limits & Clamping | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 4 | Ctrl+0 Reset Shortcut | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 5 | Zoom UI Isolation | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ |
| 6 | Workspace Gutter (10px) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 7 | Panel-to-Panel Gutter (10px) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 8 | Sidebar 12px Padding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 9 | Notes Panel 10px Padding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 10 | Note Card & Toolbar Alignment | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 11 | Editor Content Padding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 12 | Section Spacing | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |
| 13 | Explicit Button Padding | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ |

## Test Architecture
- Test runner: `npm test` (`vitest run`)
- Type check: `npm run check` (`svelte-check`)
- Build verification: `npm run build` (`vite build`)
- Backend integration: `cd src-tauri && cargo test`
- Unit test files: `src/lib/utils/zoom.test.ts`, `src/lib/utils/layout.test.ts`, `src/lib/utils/markdown.test.ts`

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Note editing while rapidly zooming in and out with mouse wheel | F1, F2, F3, F5 | Medium |
| 2 | Resetting zoom from boundary extremes (10% and 500%) via Ctrl+0 | F3, F4, F5 | Low |
| 3 | Window resizing with 10px workspace and panel gutters | F6, F7, F10, F11 | High |
| 4 | Panel dragging and collapse with 10px gutters | F6, F7, F8, F9 | Medium |
| 5 | Theme switching across all 6 themes with canvas background | F6, F7 | Low |

## Coverage Thresholds
- Tier 1: ≥5 per feature
- Tier 2: ≥5 per feature (where boundaries exist)
- Tier 3: pairwise coverage of major feature interactions
- Tier 4: ≥5 realistic application scenarios

# 03 — Design System Implementation & Tokens

## 1. Executive Summary

The Notebox UI/UX redesign establishes a unified, tokenized design system rooted in CSS custom properties and standard Tailwind CSS v4 utilities. The architecture enforces strict visual harmony across all application surfaces:
- **Geometry**: 16px island panel radii, 12px note card radii, 10px outer workspace gutters, and 10px inter-panel gutters.
- **Theming**: Complete semantic token sets for all 6 curated themes (`warm-paper`, `midnight`, `forest`, `ocean`, `lavender`, `sunset`) without hardcoded component colors.
- **Elevation**: Semantic shadow scales (`--shadow-panel`, `--shadow-card`, `--shadow-sm`, `--shadow-md`, `--shadow-lg`) tuned per palette luminosity.

---

## 2. Token Definitions (`src/app.css`)

### 2.1 Spacing & Layout Geometry

```css
:root {
  /* 4px-Based Centralized Spacing System */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* Workspace Island Proportions */
  --workspace-gutter: 10px;
  --panel-gutter: 10px;

  /* Standardized Border Radii */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-control: 8px;
  --radius-md: 10px;
  --radius-input: 10px;
  --radius-card: 12px;
  --radius-lg: 14px;
  --radius-panel: 16px;
  --radius-island: 16px;
  --radius-modal: 16px;
  --radius-pill: 9999px;

  /* Panel Dimensions & Clamps */
  --sidebar-width-default: 240px;
  --sidebar-width-min: 200px;
  --sidebar-width-max: 380px;

  --notelist-width-default: 300px;
  --notelist-width-min: 240px;
  --notelist-width-max: 480px;

  --editor-min-width: 360px;
  --titlebar-height: 38px;
  --tabbar-height: 36px;
  --toolbar-height: 36px;
  --statusbar-height: 28px;
}
```

---

## 3. Six Curated Color Themes

Every theme provides a full semantic surface and border mapping, ensuring dark and light themes render with identical component hierarchies and zero unstyled text or cards.

| Token | Warm Paper (Light) | Midnight (Dark) | Forest (Dark) | Ocean (Light) | Lavender (Default Light) | Sunset (Dark) |
|---|---|---|---|---|---|---|
| `--bg-canvas` | `#ede5d8` | `#090e13` | `#08100c` | `#d5e3ef` | `#ECE0F8` | `#150d10` |
| `--bg-titlebar` | `#ede5d8` | `#0d1218` | `#0b1510` | `#dce7f2` | `#FAF5FB` | `#1a1215` |
| `--bg-sidebar` | `#fbf8f2` | `#121820` | `#101c16` | `#f0f5fa` | `#F5EFFD` | `#22181c` |
| `--bg-sidebar-active` | `#ebdccb` | `rgba(56,189,248,0.14)` | `rgba(16,185,129,0.16)` | `#d4e3ef` | `#E4D1FA` | `rgba(249,115,22,0.16)` |
| `--bg-notelist` | `#f3ede2` | `#141b24` | `#13221b` | `#e2ecf5` | `#F4EBFB` | `#271c21` |
| `--bg-card` | `#ffffff` | `#1f2a38` | `#1d3328` | `#ffffff` | `#FCF8FE` | `#3a2730` |
| `--bg-card-hover` | `#eadecb` | `#273647` | `#254233` | `#d5e4ef` | `#F8F1FD` | `#48313c` |
| `--bg-card-active` | `#faeed9` | `#1d3652` | `#1e4d36` | `#cbe1f2` | `#F1E8FA` | `#4d2737` |
| `--border-card-active` | `#c48137` | `#38bdf8` | `#10b981` | `#0284c7` | `#9D76F5` | `#f97316` |
| `--bg-editor` | `#fbf8f2` | `#121820` | `#101c16` | `#f0f5fa` | `#FBF7FE` | `#22181c` |
| `--bg-tab-active` | `#fbf8f2` | `#121820` | `#101c16` | `#f0f5fa` | `#FFFFFF` | `#22181c` |
| `--accent` | `#c48137` | `#38bdf8` | `#10b981` | `#0284c7` | `#8A4EF5` | `#f97316` |
| `--text-primary` | `#2c221e` | `#f1f5f9` | `#ecfdf5` | `#0c2338` | `#1E1233` | `#fdf2f4` |
| `--text-secondary` | `#5c4c44` | `#94a3b8` | `#a7f3d0` | `#335372` | `#5A4B70` | `#d6a8b4` |
| `--text-tertiary` | `#8c786c` | `#64748b` | `#689780` | `#62809e` | `#8B7D9E` | `#9d7380` |

---

## 4. Typography Scale

- **App Titles & Main Heading (H1)**: 2.1em (31.5px), -0.025em tracking, 700 weight, 1.25 line height.
- **Section Heading (H2)**: 1.5em (22.5px), -0.015em tracking, 600 weight, 1.3 line height.
- **Subsection Heading (H3)**: 1.22em (18.3px), 600 weight, 1.35 line height.
- **Body & Paragraphs**: 15px, 1.7 line height, 1.15em bottom margin.
- **UI Labels & Navigation**: 12px (0.75rem), 500 weight.
- **Metadata & Counters**: 10.5px–11px, 500/600 weight, tabular figures.
- **Code & Monospace**: `var(--font-mono)`, font-size 0.9em, 4px border-radius, subtle tinted background.

---

## 5. Interaction States & Transitions

1. **Hover States**:
   - Navigation rows: background transition to `var(--bg-sidebar-hover)` in 140ms ease.
   - Note cards: subtle border-color shift to `var(--border)` and background to `var(--bg-card-hover)`.
   - Tool buttons: subtle fill shift with scale-95 click feedback.
2. **Selected States**:
   - Navigation rows: filled capsule with `var(--bg-sidebar-active)`, `var(--accent-text)` bold font.
   - Note cards: 1.5px solid `var(--border-card-active)`, `var(--bg-card-active)` background, elevated card shadow.
3. **Focus States**:
   - Standard keyboard focus ring: `2px solid var(--border-focus)` with `2px outline-offset`.
4. **Splitter Handles**:
   - 10px interaction hit area (the inter-panel gutter).
   - Centered 1px indicator line, expanding from 30px to 42px on hover/drag with `var(--accent)` illumination.

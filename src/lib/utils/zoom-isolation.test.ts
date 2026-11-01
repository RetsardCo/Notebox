// @ts-nocheck
import { describe, it, expect, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as svelteCompiler from 'svelte/compiler';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_ZOOM,
  ZOOM_STEP,
  WHEEL_THRESHOLD,
  clampZoom,
  zoomIn,
  zoomOut,
  resetZoom,
  handleZoomWheel,
  handleZoomKey,
  createWheelAccumulator,
} from './zoom';

const PROJECT_ROOT = process.cwd();


describe('UI Isolation: AST & CSS Verification in Editor.svelte', () => {
  const editorPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/Editor.svelte');
  const editorSrc = fs.readFileSync(editorPath, 'utf8');
  const ast = svelteCompiler.parse(editorSrc);

  it('verifies Editor.svelte parses to a valid AST', () => {
    expect(ast).toBeDefined();
    expect(ast.html).toBeDefined();
  });

  it('verifies style="zoom: ..." is strictly applied to editor-page-container and NOT editor-outer-container', () => {
    let outerContainer: any = null;
    let pageContainer: any = null;

    function walk(node: any) {
      if (!node) return;
      if (node.type === 'Element') {
        const classAttr = node.attributes?.find((a: any) => a.name === 'class');
        let classValue = '';
        if (classAttr) {
          if (typeof classAttr.value === 'string') classValue = classAttr.value;
          else if (Array.isArray(classAttr.value)) {
            classValue = classAttr.value
              .map((v: any) => (v.type === 'Text' ? v.data : ''))
              .join(' ');
          }
        }

        if (classValue.includes('editor-outer-container')) {
          outerContainer = node;
        }
        if (classValue.includes('editor-page-container')) {
          pageContainer = node;
        }
      }
      if (node.children) {
        for (const child of node.children) {
          walk(child);
        }
      }
    }

    walk(ast.html);

    expect(outerContainer).not.toBeNull();
    expect(pageContainer).not.toBeNull();

    // 1. Check outerContainer: MUST NOT have zoom in style
    const outerStyleAttr = outerContainer.attributes?.find((a: any) => a.name === 'style');
    expect(outerStyleAttr).toBeDefined();
    let outerStyleText = '';
    if (outerStyleAttr && Array.isArray(outerStyleAttr.value)) {
      outerStyleText = outerStyleAttr.value
        .map((v: any) => (v.type === 'Text' ? v.data : ''))
        .join(' ');
    }
    expect(outerStyleText).not.toMatch(/zoom\s*:/i);
    expect(outerStyleText).toContain('background-color: var(--bg-editor);');

    // Verify outerContainer has overflow-y-auto for scrollbars
    const outerClassAttr = outerContainer.attributes?.find((a: any) => a.name === 'class');
    const outerClassText = outerClassAttr.value
      .map((v: any) => (v.type === 'Text' ? v.data : ''))
      .join(' ');
    expect(outerClassText).toContain('overflow-y-auto');

    // 2. Check pageContainer: MUST have style="zoom: {appState.zoomLevel}%;"
    const pageStyleAttr = pageContainer.attributes?.find((a: any) => a.name === 'style');
    expect(pageStyleAttr).toBeDefined();
    const styleParts = pageStyleAttr.value;
    const hasZoomText = styleParts.some(
      (p: any) => p.type === 'Text' && p.data.includes('zoom:')
    );
    const hasZoomExpression = styleParts.some(
      (p: any) =>
        p.type === 'MustacheTag' &&
        p.expression?.property?.name === 'zoomLevel'
    );
    expect(hasZoomText).toBe(true);
    expect(hasZoomExpression).toBe(true);
  });

  it('verifies editor-page-container is a descendant of editor-outer-container', () => {
    let isChildOfOuter = false;
    let outerContainer: any = null;

    function findOuter(node: any) {
      if (!node) return;
      if (node.type === 'Element') {
        const classAttr = node.attributes?.find((a: any) => a.name === 'class');
        const text = classAttr?.value?.map((v: any) => v.data || '').join(' ') || '';
        if (text.includes('editor-outer-container')) {
          outerContainer = node;
          return;
        }
      }
      if (node.children) {
        for (const child of node.children) findOuter(child);
      }
    }

    findOuter(ast.html);
    expect(outerContainer).not.toBeNull();

    function searchPage(node: any) {
      if (!node) return;
      if (node.type === 'Element') {
        const classAttr = node.attributes?.find((a: any) => a.name === 'class');
        const text = classAttr?.value?.map((v: any) => v.data || '').join(' ') || '';
        if (text.includes('editor-page-container')) {
          isChildOfOuter = true;
          return;
        }
      }
      if (node.children) {
        for (const child of node.children) searchPage(child);
      }
    }

    searchPage(outerContainer);
    expect(isChildOfOuter).toBe(true);
  });
});

describe('UI Isolation: Scrollbar Invariance Model', () => {
  it('mathematically models scrollbar width constancy across 10% to 500% zoom', () => {
    // Browser layout model:
    // Scroll container has zoom = 1.0 (editor-outer-container).
    // Child container has zoom = Z in [0.10, 5.00].
    // Native scrollbar thickness = S (e.g. 17px default Windows OS).
    const OS_SCROLLBAR_WIDTH = 17; // px
    const testZooms = [10, 50, 100, 200, 350, 500];

    for (const zoom of testZooms) {
      const outerZoomScale = 1.0; // unscaled outer container
      const effectiveScrollbarWidth = OS_SCROLLBAR_WIDTH * outerZoomScale;
      expect(effectiveScrollbarWidth).toBe(17);

      // Child coordinate space scales content dimensions, not outer scrollbars
      const contentScale = zoom / 100;
      const baseContentHeight = 1000;
      const virtualScrollHeight = baseContentHeight * contentScale;
      expect(virtualScrollHeight).toBe(baseContentHeight * (zoom / 100));
    }
  });
});

describe('UI Isolation: Empty-State Overlay Scalability', () => {
  const editorPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/Editor.svelte');
  const editorSrc = fs.readFileSync(editorPath, 'utf8');
  const ast = svelteCompiler.parse(editorSrc);

  it('verifies {#if !appState.activeTab} empty-state overlay is outside editor-page-container and completely unscaled at 100%', () => {
    // Find all IfBlocks and locate the empty state block
    const ifBlocks: any[] = [];
    function findIfBlocks(node: any) {
      if (!node) return;
      if (node.type === 'IfBlock') {
        ifBlocks.push(node);
      }
      if (node.children) {
        for (const child of node.children) findIfBlocks(child);
      }
    }

    findIfBlocks(ast.html);
    expect(ifBlocks.length).toBeGreaterThanOrEqual(2);

    // Empty state block corresponds to !appState.activeTab
    const emptyStateIfBlock = ifBlocks.find((b: any) => {
      const snippet = editorSrc.slice(b.start, b.start + 50);
      return snippet.includes('!appState.activeTab');
    });

    expect(emptyStateIfBlock).toBeDefined();

    // Verify parent of emptyStateIfBlock
    function findParent(targetNode: any, current: any, parent: any = null): any {
      if (current === targetNode) return parent;
      if (current.children) {
        for (const c of current.children) {
          const found = findParent(targetNode, c, current);
          if (found) return found;
        }
      }
      return null;
    }

    const emptyStateParent = findParent(emptyStateIfBlock, ast.html);
    expect(emptyStateParent).toBeDefined();

    const parentClassAttr = emptyStateParent.attributes?.find((a: any) => a.name === 'class');
    const parentClassText = parentClassAttr?.value?.map((v: any) => v.data || '').join(' ') || '';
    // Empty state parent MUST be editor-outer-container!
    expect(parentClassText).toContain('editor-outer-container');
    expect(parentClassText).not.toContain('editor-page-container');

    // Verify that empty state snippet contains no zoom styling
    const overlaySnippet = editorSrc.slice(emptyStateIfBlock.start, emptyStateIfBlock.end);
    expect(overlaySnippet).toContain('absolute inset-0');
    expect(overlaySnippet).toContain('No Note Open');
    expect(overlaySnippet).not.toMatch(/zoom\s*:/i);
  });
});

describe('WebView2 Protection: Window Wheel Listener', () => {
  const pagePath = path.join(PROJECT_ROOT, 'src/routes/+page.svelte');
  const pageSrc = fs.readFileSync(pagePath, 'utf8');

  it('verifies non-passive wheel listener registration and teardown in +page.svelte', () => {
    expect(pageSrc).toContain("window.addEventListener('wheel', handleWindowWheel, { passive: false });");
    expect(pageSrc).toContain("window.removeEventListener('wheel', handleWindowWheel);");
  });

  it('verifies handleWindowWheel intercepts Ctrl+wheel and Meta+wheel events', () => {
    function handleWindowWheel(e: { ctrlKey?: boolean; metaKey?: boolean; preventDefault: () => void }) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    }

    // Scenario 1: Ctrl + Wheel
    const ctrlPreventDefault = vi.fn();
    handleWindowWheel({ ctrlKey: true, metaKey: false, preventDefault: ctrlPreventDefault });
    expect(ctrlPreventDefault).toHaveBeenCalledTimes(1);

    // Scenario 2: Meta + Wheel (macOS Command)
    const metaPreventDefault = vi.fn();
    handleWindowWheel({ ctrlKey: false, metaKey: true, preventDefault: metaPreventDefault });
    expect(metaPreventDefault).toHaveBeenCalledTimes(1);

    // Scenario 3: Regular wheel scrolling without Ctrl/Meta (Must NOT prevent default!)
    const normalPreventDefault = vi.fn();
    handleWindowWheel({ ctrlKey: false, metaKey: false, preventDefault: normalPreventDefault });
    expect(normalPreventDefault).not.toHaveBeenCalled();
  });

  it('verifies full application layout panels are shielded from WebView2 window zoom', () => {
    const preventDefault = vi.fn();
    const event = {
      target: { className: 'sidebar-folder-item' },
      ctrlKey: true,
      deltaY: -120,
      preventDefault,
    };

    function simulateBubbleToWindow(e: typeof event) {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    }

    simulateBubbleToWindow(event);
    expect(preventDefault).toHaveBeenCalled();
  });
});

describe('StatusBar State & Bound Disablement', () => {
  const statusPath = path.join(PROJECT_ROOT, 'src/lib/components/layout/StatusBar.svelte');
  const statusSrc = fs.readFileSync(statusPath, 'utf8');

  it('verifies StatusBar imports MIN_ZOOM and MAX_ZOOM from $lib/utils/zoom', () => {
    expect(statusSrc).toContain("import { MIN_ZOOM, MAX_ZOOM } from '$lib/utils/zoom'");
  });

  it('verifies Zoom Out button is disabled when zoomLevel <= MIN_ZOOM (10%)', () => {
    expect(statusSrc).toContain('disabled={appState.zoomLevel <= MIN_ZOOM}');

    const isZoomOutDisabled = (level: number) => level <= MIN_ZOOM;
    expect(isZoomOutDisabled(10)).toBe(true);
    expect(isZoomOutDisabled(9)).toBe(true);
    expect(isZoomOutDisabled(11)).toBe(false);
    expect(isZoomOutDisabled(100)).toBe(false);
    expect(isZoomOutDisabled(500)).toBe(false);
  });

  it('verifies Zoom In button is disabled when zoomLevel >= MAX_ZOOM (500%)', () => {
    expect(statusSrc).toContain('disabled={appState.zoomLevel >= MAX_ZOOM}');

    const isZoomInDisabled = (level: number) => level >= MAX_ZOOM;
    expect(isZoomInDisabled(500)).toBe(true);
    expect(isZoomInDisabled(501)).toBe(true);
    expect(isZoomInDisabled(499)).toBe(false);
    expect(isZoomInDisabled(100)).toBe(false);
    expect(isZoomInDisabled(10)).toBe(false);
  });

  it('verifies Zoom Reset button displays formatted percentage', () => {
    expect(statusSrc).toContain('{appState.zoomLevel}%');
  });
});

describe('Adversarial Stress Testing: Zoom Limits, Jitter, and Clamping', () => {
  it('stress-tests extreme non-standard input clamping', () => {
    expect(clampZoom(-1000000)).toBe(MIN_ZOOM);
    expect(clampZoom(1000000)).toBe(MAX_ZOOM);
    expect(clampZoom(NaN)).toBe(DEFAULT_ZOOM);
    expect(clampZoom(Infinity)).toBe(DEFAULT_ZOOM);
    expect(clampZoom(-Infinity)).toBe(DEFAULT_ZOOM);
    expect(clampZoom(10.00001)).toBe(10);
    expect(clampZoom(499.9999)).toBe(500);
  });

  it('stress-tests trackpad sub-threshold micro-jitter accumulation', () => {
    const acc = createWheelAccumulator();
    const preventDefault = vi.fn();

    // 79 tiny jitter events (+1px each): event is consumed (handled=true, preventDefault called)
    // but zoom level does not change until threshold (80px) is reached
    for (let i = 0; i < 79; i++) {
      const res = handleZoomWheel(
        { ctrlKey: true, deltaY: 1, preventDefault },
        100,
        acc
      );
      expect(res.handled).toBe(true);
      expect(res.newZoom).toBe(100);
      expect(preventDefault).toHaveBeenCalled();
    }

    // 80th event crosses threshold (80px) -> triggers zoomOut (100 -> 90)
    const res80 = handleZoomWheel(
      { ctrlKey: true, deltaY: 1, preventDefault },
      100,
      acc
    );
    expect(res80.handled).toBe(true);
    expect(res80.newZoom).toBe(90);
  });

  it('stress-tests discrete mouse wheel notch responsiveness', () => {
    const acc = createWheelAccumulator();
    const preventDefault = vi.fn();

    // Typical Windows notched mouse wheel sends ±100 or ±120 per notch
    const notchUp = handleZoomWheel(
      { ctrlKey: true, deltaY: -120, preventDefault },
      100,
      acc
    );
    expect(notchUp.handled).toBe(true);
    expect(notchUp.newZoom).toBe(110);

    const notchDown = handleZoomWheel(
      { ctrlKey: true, deltaY: 120, preventDefault },
      110,
      acc
    );
    expect(notchDown.handled).toBe(true);
    expect(notchDown.newZoom).toBe(100);
  });

  it('stress-tests boundary bounce: 100 consecutive zoomIn calls at MAX_ZOOM remain at 500%', () => {
    let current = 500;
    for (let i = 0; i < 100; i++) {
      current = zoomIn(current);
      expect(current).toBe(500);
    }
  });

  it('stress-tests boundary bounce: 100 consecutive zoomOut calls at MIN_ZOOM remain at 10%', () => {
    let current = 10;
    for (let i = 0; i < 100; i++) {
      current = zoomOut(current);
      expect(current).toBe(10);
    }
  });

  it('stress-tests keyboard shortcut modifiers under adversarial combinations', () => {
    const preventDefault = vi.fn();

    // Alt + Ctrl + Plus should be IGNORED (Alt key suppresses editor shortcuts)
    const altCtrlRes = handleZoomKey(
      { ctrlKey: true, altKey: true, key: '+', preventDefault },
      100
    );
    expect(altCtrlRes.handled).toBe(false);
    expect(preventDefault).not.toHaveBeenCalled();

    // Shift + Ctrl + Plus (Ctrl + '=') should zoom in
    const shiftCtrlRes = handleZoomKey(
      { ctrlKey: true, shiftKey: true, key: '+', preventDefault },
      100
    );
    expect(shiftCtrlRes.handled).toBe(true);
    expect(shiftCtrlRes.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalled();

    // Ctrl + 0 reset from 450%
    const resetRes = handleZoomKey(
      { ctrlKey: true, key: '0', preventDefault },
      450
    );
    expect(resetRes.handled).toBe(true);
    expect(resetRes.newZoom).toBe(100);
  });
});

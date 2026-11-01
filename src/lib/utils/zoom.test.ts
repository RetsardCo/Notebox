import { describe, it, expect, vi } from 'vitest';
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

describe('Zoom Constants', () => {
  it('defines correct boundary constants', () => {
    expect(MIN_ZOOM).toBe(10);
    expect(MAX_ZOOM).toBe(500);
    expect(DEFAULT_ZOOM).toBe(100);
    expect(ZOOM_STEP).toBe(10);
    expect(WHEEL_THRESHOLD).toBe(80);
  });
});

describe('clampZoom', () => {
  it('retains values within valid bounds', () => {
    expect(clampZoom(100)).toBe(100);
    expect(clampZoom(250)).toBe(250);
    expect(clampZoom(10)).toBe(10);
    expect(clampZoom(500)).toBe(500);
  });

  it('clamps values below MIN_ZOOM to 10', () => {
    expect(clampZoom(9)).toBe(10);
    expect(clampZoom(0)).toBe(10);
    expect(clampZoom(-50)).toBe(10);
    expect(clampZoom(-1000)).toBe(10);
  });

  it('clamps values above MAX_ZOOM to 500', () => {
    expect(clampZoom(501)).toBe(500);
    expect(clampZoom(1000)).toBe(500);
    expect(clampZoom(99999)).toBe(500);
  });

  it('rounds decimal zoom levels to nearest integer', () => {
    expect(clampZoom(99.4)).toBe(99);
    expect(clampZoom(99.6)).toBe(100);
    expect(clampZoom(10.2)).toBe(10);
  });

  it('handles non-finite values safely by returning DEFAULT_ZOOM', () => {
    expect(clampZoom(NaN)).toBe(DEFAULT_ZOOM);
    expect(clampZoom(Infinity)).toBe(DEFAULT_ZOOM);
    expect(clampZoom(-Infinity)).toBe(DEFAULT_ZOOM);
  });
});

describe('zoomIn and zoomOut', () => {
  it('increments zoom by ZOOM_STEP (10%)', () => {
    expect(zoomIn(100)).toBe(110);
    expect(zoomIn(10)).toBe(20);
    expect(zoomIn(480)).toBe(490);
  });

  it('clamps zoomIn at MAX_ZOOM (500%)', () => {
    expect(zoomIn(495)).toBe(500);
    expect(zoomIn(500)).toBe(500);
    expect(zoomIn(550)).toBe(500);
  });

  it('decrements zoom by ZOOM_STEP (10%)', () => {
    expect(zoomOut(100)).toBe(90);
    expect(zoomOut(500)).toBe(490);
    expect(zoomOut(20)).toBe(10);
  });

  it('clamps zoomOut at MIN_ZOOM (10%)', () => {
    expect(zoomOut(15)).toBe(10);
    expect(zoomOut(10)).toBe(10);
    expect(zoomOut(5)).toBe(10);
    expect(zoomOut(-20)).toBe(10);
  });
});

describe('resetZoom', () => {
  it('returns DEFAULT_ZOOM (100%)', () => {
    expect(resetZoom()).toBe(100);
  });
});

describe('handleZoomWheel (Stateless Mode)', () => {
  it('zooms in when scrolling up with Ctrl', () => {
    const preventDefault = vi.fn();
    const result = handleZoomWheel(
      { ctrlKey: true, deltaY: -100, preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('zooms out when scrolling down with Ctrl', () => {
    const preventDefault = vi.fn();
    const result = handleZoomWheel(
      { ctrlKey: true, deltaY: 100, preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(90);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('zooms with MetaKey (Cmd on macOS)', () => {
    const preventDefault = vi.fn();
    const result = handleZoomWheel(
      { metaKey: true, deltaY: -50, preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('ignores wheel events when neither Ctrl nor Meta is pressed', () => {
    const preventDefault = vi.fn();
    const result = handleZoomWheel(
      { ctrlKey: false, metaKey: false, deltaY: -100, preventDefault },
      100
    );
    expect(result.handled).toBe(false);
    expect(result.newZoom).toBe(100);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('ignores wheel events when deltaY is 0', () => {
    const preventDefault = vi.fn();
    const result = handleZoomWheel(
      { ctrlKey: true, deltaY: 0, preventDefault },
      100
    );
    expect(result.handled).toBe(false);
    expect(result.newZoom).toBe(100);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('respects clamping boundaries during wheel zoom', () => {
    const preventDefault = vi.fn();
    const maxResult = handleZoomWheel(
      { ctrlKey: true, deltaY: -100, preventDefault },
      500
    );
    expect(maxResult.handled).toBe(true);
    expect(maxResult.newZoom).toBe(500);

    const minResult = handleZoomWheel(
      { ctrlKey: true, deltaY: 100, preventDefault },
      10
    );
    expect(minResult.handled).toBe(true);
    expect(minResult.newZoom).toBe(10);
  });
});

describe('handleZoomWheel (Accumulator Mode for Trackpads)', () => {
  it('smoothly accumulates fractional deltas until threshold is reached', () => {
    const accumulator = createWheelAccumulator();
    const preventDefault = vi.fn();

    // First event: deltaY -30 (< 80px threshold)
    const step1 = handleZoomWheel(
      { ctrlKey: true, deltaY: -30, preventDefault },
      100,
      accumulator
    );
    expect(step1.handled).toBe(true);
    expect(step1.newZoom).toBe(100); // Not stepped yet

    // Second event: deltaY -30 (total -60px, still < 80px)
    const step2 = handleZoomWheel(
      { ctrlKey: true, deltaY: -30, preventDefault },
      100,
      accumulator
    );
    expect(step2.handled).toBe(true);
    expect(step2.newZoom).toBe(100); // Still buffered

    // Third event: deltaY -30 (total -90px >= 80px threshold) -> steps +10%
    const step3 = handleZoomWheel(
      { ctrlKey: true, deltaY: -30, preventDefault },
      100,
      accumulator
    );
    expect(step3.handled).toBe(true);
    expect(step3.newZoom).toBe(110);
    expect(accumulator.accumulatedDelta).toBe(-10); // 90 - 80 remainder
  });

  it('resets accumulator when scroll direction is reversed', () => {
    const accumulator = createWheelAccumulator();
    const preventDefault = vi.fn();

    // Scroll up 60px
    handleZoomWheel({ ctrlKey: true, deltaY: -60, preventDefault }, 100, accumulator);
    expect(accumulator.accumulatedDelta).toBe(-60);

    // Immediately scroll down 40px (direction reversed)
    handleZoomWheel({ ctrlKey: true, deltaY: 40, preventDefault }, 100, accumulator);
    expect(accumulator.accumulatedDelta).toBe(40);
  });

  it('normalizes deltaMode line and page units', () => {
    const accumulator = createWheelAccumulator();
    const preventDefault = vi.fn();

    // deltaMode 1 (lines): deltaY = -4 lines * 20 = -80px -> triggers step immediately
    const res = handleZoomWheel(
      { ctrlKey: true, deltaY: -4, deltaMode: 1, preventDefault },
      100,
      accumulator
    );
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(110);
  });
});

describe('handleZoomKey', () => {
  it('zooms in on Ctrl+=', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: true, key: '=', preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('zooms in on Ctrl++', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: true, key: '+', preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('zooms in on NumpadAdd and Equal codes', () => {
    const preventDefault = vi.fn();
    const r1 = handleZoomKey(
      { ctrlKey: true, code: 'NumpadAdd', preventDefault },
      100
    );
    expect(r1.handled).toBe(true);
    expect(r1.newZoom).toBe(110);

    const r2 = handleZoomKey(
      { ctrlKey: true, code: 'Equal', preventDefault },
      100
    );
    expect(r2.handled).toBe(true);
    expect(r2.newZoom).toBe(110);
  });

  it('zooms out on Ctrl+-', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: true, key: '-', preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(90);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it('zooms out on Ctrl+_ and NumpadSubtract', () => {
    const preventDefault = vi.fn();
    const r1 = handleZoomKey(
      { ctrlKey: true, key: '_', preventDefault },
      100
    );
    expect(r1.handled).toBe(true);
    expect(r1.newZoom).toBe(90);

    const r2 = handleZoomKey(
      { ctrlKey: true, code: 'NumpadSubtract', preventDefault },
      100
    );
    expect(r2.handled).toBe(true);
    expect(r2.newZoom).toBe(90);
  });

  it('resets zoom to 100 on Ctrl+0 from any level', () => {
    const preventDefault = vi.fn();
    const r1 = handleZoomKey(
      { ctrlKey: true, key: '0', preventDefault },
      300
    );
    expect(r1.handled).toBe(true);
    expect(r1.newZoom).toBe(100);
    expect(preventDefault).toHaveBeenCalled();

    const r2 = handleZoomKey(
      { ctrlKey: true, code: 'Numpad0', preventDefault },
      20
    );
    expect(r2.handled).toBe(true);
    expect(r2.newZoom).toBe(100);

    const r3 = handleZoomKey(
      { ctrlKey: true, code: 'Digit0', preventDefault },
      450
    );
    expect(r3.handled).toBe(true);
    expect(r3.newZoom).toBe(100);
  });

  it('works with MetaKey on macOS', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { metaKey: true, key: '=', preventDefault },
      100
    );
    expect(result.handled).toBe(true);
    expect(result.newZoom).toBe(110);
  });

  it('ignores keys without Ctrl or Meta', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: false, metaKey: false, key: '=', preventDefault },
      100
    );
    expect(result.handled).toBe(false);
    expect(result.newZoom).toBe(100);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('ignores keys when Alt is pressed (e.g. Alt+Ctrl combinations)', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: true, altKey: true, key: '=', preventDefault },
      100
    );
    expect(result.handled).toBe(false);
    expect(result.newZoom).toBe(100);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('ignores non-zoom shortcuts', () => {
    const preventDefault = vi.fn();
    const result = handleZoomKey(
      { ctrlKey: true, key: 's', preventDefault },
      100
    );
    expect(result.handled).toBe(false);
    expect(result.newZoom).toBe(100);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('clamps zoom limits on keyboard shortcuts', () => {
    const preventDefault = vi.fn();
    const maxResult = handleZoomKey(
      { ctrlKey: true, key: '=', preventDefault },
      500
    );
    expect(maxResult.handled).toBe(true);
    expect(maxResult.newZoom).toBe(500);

    const minResult = handleZoomKey(
      { ctrlKey: true, key: '-', preventDefault },
      10
    );
    expect(minResult.handled).toBe(true);
    expect(minResult.newZoom).toBe(10);
  });
});

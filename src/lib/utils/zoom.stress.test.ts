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
import { appState } from '../stores/appState.svelte';

describe('Milestone 1 Empirical Stress Tests: Zoom Boundaries & Extreme Iterations', () => {
  it('start at 100%, call zoomIn 100 times -> must never exceed 500%', () => {
    let current = 100;
    for (let i = 1; i <= 100; i++) {
      current = zoomIn(current);
      expect(current).toBeLessThanOrEqual(500);
      expect(current).toBeGreaterThanOrEqual(10);
      expect(Number.isInteger(current)).toBe(true);
      if (i >= 40) {
        // 100 + 40 * 10 = 500. After 40 iterations it must be exactly 500.
        expect(current).toBe(500);
      }
    }
    expect(current).toBe(500);
  });

  it('start at 100%, call zoomOut 100 times -> must never drop below 10%', () => {
    let current = 100;
    for (let i = 1; i <= 100; i++) {
      current = zoomOut(current);
      expect(current).toBeGreaterThanOrEqual(10);
      expect(current).toBeLessThanOrEqual(500);
      expect(Number.isInteger(current)).toBe(true);
      if (i >= 9) {
        // 100 - 9 * 10 = 10. After 9 iterations it must be exactly 10.
        expect(current).toBe(10);
      }
    }
    expect(current).toBe(10);
  });

  it('10,000 extreme zoomIn iterations remain strictly capped at 500%', () => {
    let current = 100;
    for (let i = 0; i < 10000; i++) {
      current = zoomIn(current);
    }
    expect(current).toBe(500);
  });

  it('10,000 extreme zoomOut iterations remain strictly floored at 10%', () => {
    let current = 100;
    for (let i = 0; i < 10000; i++) {
      current = zoomOut(current);
    }
    expect(current).toBe(10);
  });

  it('boundary neighborhood step tests for zoomIn and zoomOut', () => {
    expect(zoomIn(490)).toBe(500);
    expect(zoomIn(495)).toBe(500);
    expect(zoomIn(499)).toBe(500);
    expect(zoomIn(500)).toBe(500);
    expect(zoomIn(501)).toBe(500);
    expect(zoomIn(1000)).toBe(500);

    expect(zoomOut(20)).toBe(10);
    expect(zoomOut(15)).toBe(10);
    expect(zoomOut(11)).toBe(10);
    expect(zoomOut(10)).toBe(10);
    expect(zoomOut(9)).toBe(10);
    expect(zoomOut(0)).toBe(10);
    expect(zoomOut(-50)).toBe(10);
  });
});

describe('Milestone 1 Empirical Stress Tests: Ctrl+0 Reset From All Possible Values', () => {
  const testValues = [
    10,
    15,
    99,
    100,
    101,
    499,
    500,
    NaN,
    -100,
    0,
    Infinity,
    -Infinity,
    1e6,
    -1e6,
    25.75,
  ];

  it('resetZoom() unconditionally returns DEFAULT_ZOOM (100)', () => {
    expect(resetZoom()).toBe(100);
  });

  testValues.forEach((val) => {
    it(`handleZoomKey resets to 100 from value: ${val}`, () => {
      const preventDefault = vi.fn();
      const res = handleZoomKey(
        { ctrlKey: true, key: '0', preventDefault },
        val
      );
      expect(res.handled).toBe(true);
      expect(res.newZoom).toBe(100);
      expect(preventDefault).toHaveBeenCalledTimes(1);
    });

    it(`handleZoomKey resets with Numpad0 and Digit0 from value: ${val}`, () => {
      const r1 = handleZoomKey(
        { ctrlKey: true, code: 'Numpad0' },
        val
      );
      expect(r1.handled).toBe(true);
      expect(r1.newZoom).toBe(100);

      const r2 = handleZoomKey(
        { ctrlKey: true, code: 'Digit0' },
        val
      );
      expect(r2.handled).toBe(true);
      expect(r2.newZoom).toBe(100);
    });
  });

  it('clampZoom safely sanitizes edge cases including NaN and -100', () => {
    expect(clampZoom(10)).toBe(10);
    expect(clampZoom(15)).toBe(15);
    expect(clampZoom(499)).toBe(499);
    expect(clampZoom(500)).toBe(500);
    expect(clampZoom(NaN)).toBe(100);
    expect(clampZoom(-100)).toBe(10);
    expect(clampZoom(Infinity)).toBe(100);
    expect(clampZoom(-Infinity)).toBe(100);
    expect(clampZoom(0)).toBe(10);
  });
});

describe('Milestone 1 Empirical Stress Tests: Rapid Wheel Oscillations & Trackpad Accumulation', () => {
  it('rapid oscillation: alternating notched wheel (+120, -120) over 100 cycles', () => {
    const acc = createWheelAccumulator();
    let zoom = 100;
    const preventDefault = vi.fn();

    for (let i = 0; i < 100; i++) {
      // Scroll UP (zoom in)
      const resUp = handleZoomWheel(
        { ctrlKey: true, deltaY: -120, preventDefault },
        zoom,
        acc
      );
      expect(resUp.handled).toBe(true);
      expect(resUp.newZoom).toBe(zoom + 10);
      zoom = resUp.newZoom;

      // Scroll DOWN (zoom out) immediately
      const resDown = handleZoomWheel(
        { ctrlKey: true, deltaY: 120, preventDefault },
        zoom,
        acc
      );
      expect(resDown.handled).toBe(true);
      expect(resDown.newZoom).toBe(zoom - 10);
      zoom = resDown.newZoom;

      // Invariant: zoom level returns to 100 each cycle
      expect(zoom).toBe(100);
    }
    expect(zoom).toBe(100);
  });

  it('rapid oscillation: micro trackpad events reversing direction before reaching threshold', () => {
    const acc = createWheelAccumulator();
    let zoom = 100;

    // Scroll UP 50px (under 80px threshold)
    let res = handleZoomWheel({ ctrlKey: true, deltaY: -50 }, zoom, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(100);
    expect(acc.accumulatedDelta).toBe(-50);

    // Immediately reverse direction: scroll DOWN 40px
    // Reversal should reset accumulated delta to +40, not add to -50
    res = handleZoomWheel({ ctrlKey: true, deltaY: 40 }, zoom, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(100);
    expect(acc.accumulatedDelta).toBe(40);

    // Continue scrolling DOWN another 50px (total 90px >= 80px)
    res = handleZoomWheel({ ctrlKey: true, deltaY: 50 }, zoom, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(90);
    expect(acc.accumulatedDelta).toBe(10); // 90 - 80 remainder
  });

  it('asymmetric rapid oscillations with multi-step bursts', () => {
    const acc = createWheelAccumulator();
    let zoom = 100;

    // Big scroll up: -240px (3 steps = +30%)
    let res = handleZoomWheel({ ctrlKey: true, deltaY: -240 }, zoom, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(130);
    expect(acc.accumulatedDelta).toBe(0);
    zoom = res.newZoom;

    // Small scroll down: +30px (sub-threshold)
    res = handleZoomWheel({ ctrlKey: true, deltaY: 30 }, zoom, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(130);
    expect(acc.accumulatedDelta).toBe(30);

    // Reverse to scroll up: -300px
    res = handleZoomWheel({ ctrlKey: true, deltaY: -300 }, zoom, acc);
    expect(res.handled).toBe(true);
    // 300 / 80 = 3 steps (-240px), remainder -60px
    expect(res.newZoom).toBe(160);
    expect(acc.accumulatedDelta).toBe(-60);
  });

  it('1,000 pseudorandom chaotic wheel events maintain invariants [10, 500]', () => {
    const acc = createWheelAccumulator();
    let zoom = 100;

    // Simple deterministic LCG pseudorandom generator
    let seed = 42;
    function rand() {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    for (let i = 0; i < 1000; i++) {
      // Random deltaY between -300 and +300
      const deltaY = (rand() - 0.5) * 600;
      const res = handleZoomWheel({ ctrlKey: true, deltaY }, zoom, acc);
      expect(res.handled).toBe(true);
      expect(res.newZoom).toBeGreaterThanOrEqual(10);
      expect(res.newZoom).toBeLessThanOrEqual(500);
      expect(Number.isInteger(res.newZoom)).toBe(true);
      zoom = res.newZoom;
    }
  });

  it('handles idle timeout reset (> 250ms) in accumulator', () => {
    const acc = createWheelAccumulator();
    acc.accumulatedDelta = 70; // Just below threshold
    acc.lastWheelTime = 1000;

    // Mock performance.now to simulate 300ms passing
    const origNow = performance.now;
    performance.now = () => 1350;

    try {
      const res = handleZoomWheel({ ctrlKey: true, deltaY: 20 }, 100, acc);
      // Because > 250ms elapsed, 70 is wiped out, new delta is 20 (< 80)
      expect(res.handled).toBe(true);
      expect(res.newZoom).toBe(100);
      expect(acc.accumulatedDelta).toBe(20);
    } finally {
      performance.now = origNow;
    }
  });
});

describe('Milestone 1 Empirical Stress Tests: deltaMode Normalization', () => {
  it('DOM_DELTA_PIXEL (0): 1:1 scale', () => {
    const preventDefault = vi.fn();
    // Stateless
    const res = handleZoomWheel(
      { ctrlKey: true, deltaY: -100, deltaMode: 0, preventDefault },
      100
    );
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(110);
    expect(preventDefault).toHaveBeenCalled();

    // Accumulator
    const acc = createWheelAccumulator();
    const resAcc = handleZoomWheel(
      { ctrlKey: true, deltaY: -80, deltaMode: 0, preventDefault },
      100,
      acc
    );
    expect(resAcc.handled).toBe(true);
    expect(resAcc.newZoom).toBe(110);
    expect(acc.accumulatedDelta).toBe(0);
  });

  it('DOM_DELTA_LINE (1): multiplied by 20px per line', () => {
    // 4 lines = 80px = 1 step
    const acc = createWheelAccumulator();
    const res = handleZoomWheel(
      { ctrlKey: true, deltaY: -4, deltaMode: 1 },
      100,
      acc
    );
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(110);

    // 1 line = 20px (< 80px)
    const acc2 = createWheelAccumulator();
    const res2 = handleZoomWheel(
      { ctrlKey: true, deltaY: 1, deltaMode: 1 },
      100,
      acc2
    );
    expect(res2.handled).toBe(true);
    expect(res2.newZoom).toBe(100);
    expect(acc2.accumulatedDelta).toBe(20);

    // 3 more lines = total 80px -> steps down 10%
    const res3 = handleZoomWheel(
      { ctrlKey: true, deltaY: 3, deltaMode: 1 },
      100,
      acc2
    );
    expect(res3.handled).toBe(true);
    expect(res3.newZoom).toBe(90);
    expect(acc2.accumulatedDelta).toBe(0);
  });

  it('DOM_DELTA_PAGE (2): multiplied by 800px per page', () => {
    // 1 page down (+1) = 800px = 10 steps = -100%
    const acc = createWheelAccumulator();
    const resDown = handleZoomWheel(
      { ctrlKey: true, deltaY: 1, deltaMode: 2 },
      300,
      acc
    );
    expect(resDown.handled).toBe(true);
    expect(resDown.newZoom).toBe(200);

    // 1 page up (-1) = -800px = 10 steps = +100%
    const acc2 = createWheelAccumulator();
    const resUp = handleZoomWheel(
      { ctrlKey: true, deltaY: -1, deltaMode: 2 },
      100,
      acc2
    );
    expect(resUp.handled).toBe(true);
    expect(resUp.newZoom).toBe(200);
  });

  it('DOM_DELTA_PAGE boundary clamping when page exceeds limits', () => {
    // 5 pages up from 100% = +50 steps = +500% -> clamped to 500%
    const acc = createWheelAccumulator();
    const res = handleZoomWheel(
      { ctrlKey: true, deltaY: -5, deltaMode: 2 },
      100,
      acc
    );
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(500);

    // 5 pages down from 100% -> clamped to 10%
    const acc2 = createWheelAccumulator();
    const res2 = handleZoomWheel(
      { ctrlKey: true, deltaY: 5, deltaMode: 2 },
      100,
      acc2
    );
    expect(res2.handled).toBe(true);
    expect(res2.newZoom).toBe(10);
  });
});

describe('Milestone 1 Empirical Stress Tests: appState Store Integration', () => {
  it('appState zoomIn 100 times clamps cleanly at 500', () => {
    appState.resetZoom();
    expect(appState.zoomLevel).toBe(100);

    for (let i = 0; i < 100; i++) {
      appState.zoomIn();
    }
    expect(appState.zoomLevel).toBe(500);
  });

  it('appState zoomOut 100 times clamps cleanly at 10', () => {
    appState.resetZoom();
    expect(appState.zoomLevel).toBe(100);

    for (let i = 0; i < 100; i++) {
      appState.zoomOut();
    }
    expect(appState.zoomLevel).toBe(10);
  });

  it('appState resetZoom restores 100 from both 10 and 500', () => {
    appState.setZoomLevel(10);
    expect(appState.zoomLevel).toBe(10);
    appState.resetZoom();
    expect(appState.zoomLevel).toBe(100);

    appState.setZoomLevel(500);
    expect(appState.zoomLevel).toBe(500);
    appState.resetZoom();
    expect(appState.zoomLevel).toBe(100);
  });

  it('appState setZoomLevel handles adversarial values safely', () => {
    appState.setZoomLevel(NaN);
    expect(appState.zoomLevel).toBe(100);

    appState.setZoomLevel(-999);
    expect(appState.zoomLevel).toBe(10);

    appState.setZoomLevel(9999);
    expect(appState.zoomLevel).toBe(500);

    appState.setZoomLevel(150.7);
    expect(appState.zoomLevel).toBe(151);

    appState.resetZoom();
  });
});

describe('Milestone 1 Empirical Stress Tests: Edge Cases & Non-standard Events', () => {
  it('ignores deltaY = 0 without mutating accumulator or zoom', () => {
    const acc = createWheelAccumulator();
    acc.accumulatedDelta = 50;
    const res = handleZoomWheel({ ctrlKey: true, deltaY: 0 }, 100, acc);
    expect(res.handled).toBe(false);
    expect(res.newZoom).toBe(100);
    expect(acc.accumulatedDelta).toBe(50);
  });

  it('handles negative zero (-0) gracefully', () => {
    const res = handleZoomWheel({ ctrlKey: true, deltaY: -0 }, 100);
    expect(res.handled).toBe(false);
    expect(res.newZoom).toBe(100);
  });

  it('recovers safely if accumulator delta is corrupted by NaN', () => {
    const acc = createWheelAccumulator();
    acc.accumulatedDelta = NaN;
    // Sending a new valid scroll event with direction should reset NaN accumulator to 0 + delta
    const res = handleZoomWheel({ ctrlKey: true, deltaY: 100 }, 100, acc);
    expect(res.handled).toBe(true);
    expect(res.newZoom).toBe(90);
    expect(acc.accumulatedDelta).toBe(20);
  });

  it('ignores keyboard shortcuts when Ctrl is combined with Alt', () => {
    const res = handleZoomKey({ ctrlKey: true, altKey: true, key: '0' }, 100);
    expect(res.handled).toBe(false);
    expect(res.newZoom).toBe(100);
  });

  it('handles empty or missing event properties without throwing', () => {
    expect(() => handleZoomKey({}, 100)).not.toThrow();
    expect(handleZoomKey({}, 100)).toEqual({ handled: false, newZoom: 100 });

    expect(() => handleZoomWheel({ deltaY: 0 }, 100)).not.toThrow();
    expect(handleZoomWheel({ deltaY: 0 }, 100)).toEqual({ handled: false, newZoom: 100 });
  });
});

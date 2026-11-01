/**
 * Zoom utility module for NoteFlow editor text zooming.
 * Implements pure zoom math, bounds clamping, wheel event decoding,
 * and keyboard shortcut handling.
 */

export const MIN_ZOOM = 10;
export const MAX_ZOOM = 500;
export const DEFAULT_ZOOM = 100;
export const ZOOM_STEP = 10;
export const WHEEL_THRESHOLD = 80;

export interface ZoomWheelLikeEvent {
  ctrlKey?: boolean;
  metaKey?: boolean;
  deltaY: number;
  deltaMode?: number;
  preventDefault?: () => void;
}

export interface ZoomKeyLikeEvent {
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  key?: string;
  code?: string;
  preventDefault?: () => void;
}

export interface WheelAccumulator {
  accumulatedDelta: number;
  lastWheelTime: number;
}

export function createWheelAccumulator(): WheelAccumulator {
  return { accumulatedDelta: 0, lastWheelTime: 0 };
}

/**
 * Clamps a zoom level between MIN_ZOOM (10) and MAX_ZOOM (500).
 * Rounds to nearest integer and handles non-finite values safely.
 */
export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) {
    return DEFAULT_ZOOM;
  }
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom)));
}

/**
 * Increases zoom by ZOOM_STEP (10%), clamped to MAX_ZOOM (500%).
 */
export function zoomIn(currentZoom: number): number {
  return clampZoom(currentZoom + ZOOM_STEP);
}

/**
 * Decreases zoom by ZOOM_STEP (10%), clamped to MIN_ZOOM (10%).
 */
export function zoomOut(currentZoom: number): number {
  return clampZoom(currentZoom - ZOOM_STEP);
}

/**
 * Resets zoom level to DEFAULT_ZOOM (100%).
 */
export function resetZoom(): number {
  return DEFAULT_ZOOM;
}

/**
 * Decodes wheel events when Ctrl or Meta key is pressed.
 * Scrolling UP (deltaY < 0) zooms in.
 * Scrolling DOWN (deltaY > 0) zooms out.
 * Optionally supports a WheelAccumulator for smooth trackpad pinch/scroll.
 */
export function handleZoomWheel(
  event: ZoomWheelLikeEvent,
  currentZoom: number,
  accumulator?: WheelAccumulator
): { handled: boolean; newZoom: number } {
  if (!event.ctrlKey && !event.metaKey) {
    return { handled: false, newZoom: currentZoom };
  }

  if (event.deltaY === 0) {
    return { handled: false, newZoom: currentZoom };
  }

  event.preventDefault?.();

  // Normalize delta across deltaMode (pixel = 0, line = 1, page = 2)
  let delta = event.deltaY;
  if (event.deltaMode === 1) {
    delta *= 20;
  } else if (event.deltaMode === 2) {
    delta *= 800;
  }

  if (accumulator) {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    // Reset if idle for > 250ms or if scroll direction reversed
    if (
      now - accumulator.lastWheelTime > 250 ||
      (accumulator.accumulatedDelta !== 0 && Math.sign(delta) !== Math.sign(accumulator.accumulatedDelta))
    ) {
      accumulator.accumulatedDelta = 0;
    }
    accumulator.lastWheelTime = now;
    accumulator.accumulatedDelta += delta;

    if (Math.abs(accumulator.accumulatedDelta) >= WHEEL_THRESHOLD) {
      const steps = Math.trunc(accumulator.accumulatedDelta / WHEEL_THRESHOLD);
      accumulator.accumulatedDelta -= steps * WHEEL_THRESHOLD;
      // Negative delta = scroll UP = zoom IN; Positive delta = scroll DOWN = zoom OUT
      const zoomChange = -steps * ZOOM_STEP;
      return { handled: true, newZoom: clampZoom(currentZoom + zoomChange) };
    }
    return { handled: true, newZoom: currentZoom };
  }

  // Stateless fallback for notched mouse wheels and unit tests
  if (delta < 0) {
    return { handled: true, newZoom: zoomIn(currentZoom) };
  } else {
    return { handled: true, newZoom: zoomOut(currentZoom) };
  }
}

/**
 * Decodes keyboard shortcuts for zoom when Ctrl or Meta key is pressed:
 * - Zoom In: Ctrl + '=' or '+' or 'Add' or 'NumpadAdd'
 * - Zoom Out: Ctrl + '-' or '_' or 'Subtract' or 'NumpadSubtract'
 * - Reset Zoom: Ctrl + '0' or 'Numpad0'
 */
export function handleZoomKey(
  event: ZoomKeyLikeEvent,
  currentZoom: number
): { handled: boolean; newZoom: number } {
  const ctrl = Boolean(event.ctrlKey || event.metaKey);
  if (!ctrl || event.altKey) {
    return { handled: false, newZoom: currentZoom };
  }

  const key = event.key;
  const code = event.code;

  // Zoom In: '=' or '+' or NumpadAdd
  if (key === '=' || key === '+' || key === 'Add' || code === 'NumpadAdd' || code === 'Equal') {
    event.preventDefault?.();
    return { handled: true, newZoom: zoomIn(currentZoom) };
  }

  // Zoom Out: '-' or '_' or NumpadSubtract
  if (key === '-' || key === '_' || key === 'Subtract' || code === 'NumpadSubtract' || code === 'Minus') {
    event.preventDefault?.();
    return { handled: true, newZoom: zoomOut(currentZoom) };
  }

  // Reset Zoom: '0' or Numpad0
  if (key === '0' || key === ')' || code === 'Numpad0' || code === 'Digit0') {
    event.preventDefault?.();
    return { handled: true, newZoom: resetZoom() };
  }

  return { handled: false, newZoom: currentZoom };
}

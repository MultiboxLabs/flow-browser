import { useState, useLayoutEffect, RefObject, useCallback, useRef } from "react";
import { usePortalContext } from "@/components/portal/portal";

/** Number of consecutive stable frames before the rAF loop auto-stops. */
const SETTLE_FRAMES = 3;

/** Default epsilon (in px) for floating-point comparison. */
const DEFAULT_EPSILON = 0.5;

export interface UseBoundingRectOptions {
  /**
   * When `true`, runs a continuous `requestAnimationFrame` loop that never
   * auto-stops. Toggle this on during animations for frame-accurate tracking,
   * and off when the element is static to save resources.
   */
  observingWithLoop?: boolean;

  /**
   * Pixel threshold for change detection.  Differences smaller than this are
   * ignored to suppress sub-pixel float jitter.  Defaults to 0.5.
   */
  epsilon?: number;
}

/**
 * Tracks an element's `getBoundingClientRect()` over time, adjusted by the
 * portal offset (if rendered inside a `PortalComponent`).
 *
 * Measurement strategy:
 * - A `ResizeObserver` on the target, plus global `scroll` (capture) and
 *   `resize` events, detect layout changes and kick-start a short rAF burst.
 * - The burst runs for a few frames after the last detected change
 *   (`SETTLE_FRAMES`) then auto-stops, keeping CPU usage near-zero when
 *   the element is static.
 * - When `observingWithLoop` is `true` the loop never auto-stops, giving
 *   frame-accurate tracking during CSS animations / transitions.
 * - All scheduling uses `requestAnimationFrame` exclusively (no timers),
 *   so measurements are always paint-synced.
 */
export function useBoundingRect<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: UseBoundingRectOptions = {}
): DOMRect | null {
  const { epsilon = DEFAULT_EPSILON } = options;

  const { x: portalX, y: portalY } = usePortalContext();
  const [rect, setRect] = useState<DOMRect | null>(null);

  // ---- mutable refs (no re-renders) ----
  const rafIdRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const lastRectRef = useRef<DOMRect | null>(null);
  const stableFramesRef = useRef(0);

  // Keep a live ref so the rAF loop reads the latest value without needing
  // to restart (which would reset stableFrames).
  const loopRef = useRef(false);
  loopRef.current = options.observingWithLoop ?? false;

  const epsilonRef = useRef(epsilon);
  epsilonRef.current = epsilon;

  // ---- core measurement tick ----
  const tick = useCallback(() => {
    const el = ref.current;
    if (!el) {
      runningRef.current = false;
      rafIdRef.current = null;
      return;
    }

    const next = el.getBoundingClientRect();

    if (rectChanged(lastRectRef.current, next, epsilonRef.current)) {
      lastRectRef.current = next;
      stableFramesRef.current = 0;
      setRect(next);
    } else {
      stableFramesRef.current += 1;
    }

    // Keep looping if explicitly requested, or if the rect hasn't settled yet.
    const keepGoing = loopRef.current || stableFramesRef.current < SETTLE_FRAMES;

    if (keepGoing) {
      rafIdRef.current = requestAnimationFrame(tick);
    } else {
      runningRef.current = false;
      rafIdRef.current = null;
    }
  }, [ref]);

  // ---- start the rAF burst (idempotent) ----
  const start = useCallback(() => {
    if (runningRef.current) {
      // Already running — just reset settle counter so it doesn't stop early.
      stableFramesRef.current = 0;
      return;
    }
    runningRef.current = true;
    stableFramesRef.current = 0;
    rafIdRef.current = requestAnimationFrame(tick);
  }, [tick]);

  // When `observingWithLoop` flips to true, make sure the loop is running.
  // When it flips to false the next tick will check `loopRef` and auto-stop
  // after SETTLE_FRAMES.
  useLayoutEffect(() => {
    if (options.observingWithLoop) {
      start();
    }
  }, [options.observingWithLoop, start]);

  // ---- observers & event listeners ----
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Take an initial measurement synchronously (before paint).
    const initial = el.getBoundingClientRect();
    lastRectRef.current = initial;
    setRect(initial);

    // ResizeObserver on the target element only — ancestor observation was
    // expensive and noisy, and `getBoundingClientRect()` already returns the
    // element's position relative to the viewport (so ancestor resize is
    // captured implicitly via the rAF burst + scroll/resize listeners).
    const ro = new ResizeObserver(start);
    ro.observe(el);

    // Window scroll (capture phase to catch nested scrollables) and resize
    // cover the remaining layout-shift scenarios.
    window.addEventListener("scroll", start, { capture: true, passive: true });
    window.addEventListener("resize", start, { passive: true });

    // Kick off a short burst to settle the initial position.
    start();

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", start, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", start);

      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      runningRef.current = false;
    };
  }, [ref, start]);

  // ---- portal offset adjustment ----
  // Recompute the final rect only when `rect`, `portalX`, or `portalY` change.
  const finalRect = rect
    ? new DOMRect(rect.x + (portalX ?? 0), rect.y + (portalY ?? 0), rect.width, rect.height)
    : null;

  // Avoid creating a new DOMRect object every render when values haven't
  // actually changed.
  const finalRectRef = useRef<DOMRect | null>(null);
  if (!rectChanged(finalRectRef.current, finalRect, epsilonRef.current)) {
    return finalRectRef.current;
  }
  finalRectRef.current = finalRect;
  return finalRect;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns `true` when two rects differ by more than `epsilon` px. */
function rectChanged(a: DOMRect | null, b: DOMRect | null, epsilon: number): boolean {
  if (a == null || b == null) return a !== b;
  return (
    Math.abs(a.x - b.x) > epsilon ||
    Math.abs(a.y - b.y) > epsilon ||
    Math.abs(a.width - b.width) > epsilon ||
    Math.abs(a.height - b.height) > epsilon
  );
}

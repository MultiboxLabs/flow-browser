import { performance } from "perf_hooks";

/**
 * Tick interval in milliseconds. ~4ms gives ~25 ticks over a 100ms animation,
 * much smoother than the ~6 ticks at 60fps (16.67ms). Node's setTimeout
 * minimum resolution is ~1ms, so 4ms is achievable.
 */
const MS_PER_TICK = 4;

/**
 * Duration of the sidebar open/close animation in milliseconds.
 * Must match SIDEBAR_ANIMATE_TIME in the renderer
 * (src/renderer/src/components/browser-ui/browser-sidebar/component.tsx).
 */
export const SIDEBAR_ANIMATE_DURATION = 100;

// ---------------------------------------------------------------------------
// Cubic-Bezier(0.4, 0, 0.2, 1) — Tailwind CSS ease-in-out
// ---------------------------------------------------------------------------
// IMPORTANT: This must match Tailwind's `ease-in-out` utility, which is
// cubic-bezier(0.4, 0, 0.2, 1) — NOT the CSS standard `ease-in-out`
// keyword which is cubic-bezier(0.42, 0, 0.58, 1). The Tailwind curve
// is front-loaded: at t=0.5 it's already ~78% done, whereas the CSS
// standard curve would be at exactly 50%.
//
// The bezier curve has control points P0=(0,0), P1=(0.4,0), P2=(0.2,1), P3=(1,1).
//
// Parametric form (parameter u ∈ [0,1]):
//   B_x(u) = 3(1-u)²u·x1 + 3(1-u)u²·x2 + u³
//   B_y(u) = 3(1-u)²u·y1 + 3(1-u)u²·y2 + u³
//
// To evaluate easing at progress x (time fraction), we solve B_x(u) = x for u,
// then return B_y(u).

const BEZ_X1 = 0.4;
const BEZ_Y1 = 0.0;
const BEZ_X2 = 0.2;
const BEZ_Y2 = 1.0;

/** Evaluate B_x(u) for cubic-bezier with given x1, x2. */
function bezierX(u: number): number {
  // B_x(u) = 3(1-u)²u·x1 + 3(1-u)u²·x2 + u³
  const u1 = 1 - u;
  return 3 * u1 * u1 * u * BEZ_X1 + 3 * u1 * u * u * BEZ_X2 + u * u * u;
}

/** Evaluate B_x'(u) (derivative) for Newton-Raphson. */
function bezierXDerivative(u: number): number {
  // d/du [3(1-u)²u·x1 + 3(1-u)u²·x2 + u³]
  const u1 = 1 - u;
  return 3 * u1 * u1 * BEZ_X1 + 6 * u1 * u * (BEZ_X2 - BEZ_X1) + 3 * u * u * (1 - BEZ_X2);
}

/** Evaluate B_y(u) for cubic-bezier with given y1, y2. */
function bezierY(u: number): number {
  const u1 = 1 - u;
  return 3 * u1 * u1 * u * BEZ_Y1 + 3 * u1 * u * u * BEZ_Y2 + u * u * u;
}

/**
 * Solve B_x(u) = x using Newton-Raphson, then evaluate B_y(u).
 * This gives the exact Tailwind cubic-bezier(0.4, 0, 0.2, 1) easing.
 *
 * Newton-Raphson converges very quickly for well-behaved cubic beziers
 * (typically 3-5 iterations for ε < 1e-7).
 */
function cubicBezierEaseInOut(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Newton-Raphson: find u such that bezierX(u) = x
  let u = x; // Initial guess (identity is a good start)
  for (let i = 0; i < 8; i++) {
    const diff = bezierX(u) - x;
    if (Math.abs(diff) < 1e-7) break;
    const deriv = bezierXDerivative(u);
    if (Math.abs(deriv) < 1e-12) break; // Avoid division by zero
    u -= diff / deriv;
    // Clamp to [0,1] to prevent divergence
    u = Math.max(0, Math.min(1, u));
  }

  return bezierY(u);
}

/**
 * Drives a numeric value from `from` to `to` over `duration` ms using
 * Tailwind's cubic-bezier(0.4, 0, 0.2, 1) timing (the `ease-in-out`
 * utility), ticking via `setTimeout` at ~4ms intervals (~25 ticks per
 * 100ms animation).
 *
 * Used to mirror the CSS sidebar margin transition in the main process
 * so that WebContentsView bounds track the content area without any
 * renderer round-trip during the animation.
 *
 * The `start(advanceMs)` method accepts an offset to backdate the
 * interpolation start, compensating for IPC transit delay so the
 * main-process animation stays synchronized with the CSS transition.
 *
 * See design/DECLARATIVE_PAGE_BOUNDS.md § "Sidebar Tween Handling".
 */
export class SidebarInterpolation {
  public currentValue: number;
  private startTime: number = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly from: number,
    private readonly to: number,
    private readonly duration: number,
    private readonly onTick: () => void,
    private readonly onComplete: () => void
  ) {
    this.currentValue = from;
  }

  /**
   * Begin the interpolation.
   * @param advanceMs — how many milliseconds to backdate the start time.
   *   This compensates for IPC transit delay: the renderer stamped
   *   `Date.now()` before sending, and the main process computes
   *   `advanceMs = Date.now() - sentAt`. The interpolation starts as if
   *   it began `advanceMs` ago, keeping it in sync with the CSS transition
   *   that started at paint time in the renderer.
   */
  start(advanceMs: number = 0): void {
    this.startTime = performance.now() - advanceMs;
    this.currentValue = this.from;

    // If advanceMs already puts us past the end, snap immediately.
    if (advanceMs >= this.duration) {
      this.currentValue = this.to;
      this.onTick();
      this.onComplete();
      return;
    }

    this.tick();
  }

  stop(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private tick = (): void => {
    const elapsed = performance.now() - this.startTime;
    const t = Math.min(elapsed / this.duration, 1);
    const eased = cubicBezierEaseInOut(t);
    this.currentValue = this.from + (this.to - this.from) * eased;
    this.onTick();

    if (t < 1) {
      this.timer = setTimeout(this.tick, MS_PER_TICK);
    } else {
      this.currentValue = this.to;
      this.onTick();
      this.timer = null;
      this.onComplete();
    }
  };
}

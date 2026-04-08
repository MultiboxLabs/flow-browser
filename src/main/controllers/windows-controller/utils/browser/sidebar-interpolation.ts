import { evaluateSidebarAnimationEasing } from "~/flow/sidebar-animation";

/**
 * Tick interval in milliseconds.
 *
 * Heavy sites can spend noticeable time on each viewport resize. Updating the
 * live WebContentsView on every compositor frame makes renderer chrome and page
 * fall out of sync. Sample more coarsely so Chromium gets more time to settle
 * between resizes while sidebar chrome still animates smoothly on top.
 */
const MS_PER_TICK = 1000 / 60;

/**
 * Drives a numeric value from `from` to `to` over `duration` ms using
 * Tailwind's cubic-bezier(0.4, 0, 0.2, 1) timing (the `ease-in-out`
 * utility), ticking via `setTimeout` at ~30fps (~3 ticks per 100ms animation).
 *
 * Used to mirror the CSS sidebar margin transition in the main process
 * so that WebContentsView bounds track the content area without any
 * renderer round-trip during the animation.
 *
 * The `start(startWallClockMs)` method accepts renderer's wall-clock
 * timestamp so main-process progress stays in same clock domain as
 * renderer's CSS transition.
 *
 * See design/DECLARATIVE_PAGE_BOUNDS.md § "Sidebar Tween Handling".
 */
export class SidebarInterpolation {
  public currentValue: number;
  private startWallClockMs: number = 0;
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
   * Begin interpolation against shared wall-clock time.
   * @param startWallClockMs Wall-clock timestamp from renderer (`Date.now()`).
   *   Main and renderer can both compare against this same clock domain.
   */
  start(startWallClockMs: number = Date.now()): void {
    this.startWallClockMs = startWallClockMs;
    this.currentValue = this.from;

    // If wall-clock time already puts us past the end, snap immediately.
    if (Date.now() - this.startWallClockMs >= this.duration) {
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
    const elapsed = Date.now() - this.startWallClockMs;
    const t = Math.min(elapsed / this.duration, 1);
    if (t >= 1) {
      this.currentValue = this.to;
      this.onTick();
      this.timer = null;
      this.onComplete();
      return;
    }

    const eased = evaluateSidebarAnimationEasing(t);
    this.currentValue = this.from + (this.to - this.from) * eased;
    this.onTick();
    this.timer = setTimeout(this.tick, MS_PER_TICK);
  };
}

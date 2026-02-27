# Declarative Page Bounds

## Problem Statement

The page content area's bounds (the region where tab `WebContentsView`s are
placed) are currently measured in the renderer process using
`getBoundingClientRect()` and sent to the main process via IPC. This approach
has several problems:

- **Latency.** The renderer measurement round-trip takes 2-3 frames (~33-50ms):
  `getBoundingClientRect()` -> React `setState` -> `useEffect` -> IPC send ->
  main process handler. During this window the tab view is positioned using stale
  bounds.

- **Layout reflows.** `getBoundingClientRect()` forces the browser to
  synchronously compute layout if any pending style/DOM changes exist. The
  `useBoundingRect` hook calls it on every rAF tick during its burst, which can
  interact poorly with other layout work in the same frame.

- **Sidebar tween gap.** When the attached sidebar animates in or out (100ms CSS
  `transition-[margin]`), the content area's width changes continuously. The
  current `ResizeObserver` + rAF burst in `useBoundingRect` does not use
  `observingWithLoop: true` for `BrowserContent`, so it only captures a few
  intermediate frames rather than tracking the full transition. The
  `WebContentsView` lags behind or snaps at the end.

- **Complexity.** The main process has a parallel "fast path" for window resize
  that caches `pageInsets` and recomputes bounds from `getContentSize()`. This
  creates two sources of truth (`_isResizing` flag, debounce timer, inset cache)
  that must be carefully coordinated.

- **Fragility.** Floating-point epsilon comparisons (0.5px), settle-frame
  heuristics, and debounce timers are all workarounds for the fundamental issue:
  the main process is guessing when renderer-reported bounds are stale.

### What already works well

- The resize fast-path concept (recompute from insets + `getContentSize()`) is
  sound; it just needs to be generalized.
- The spring-physics `TabBoundsController` for mode transitions (glance/split)
  is unrelated and stays unchanged.
- Portal and omnibox bounds genuinely depend on dynamic DOM position and are
  out of scope.

---

## Core Idea

The page content area's position is fully determined by a small set of **layout
parameters** that the renderer already knows:

| Parameter          | Source                         | When it changes                  |
| ------------------ | ------------------------------ | -------------------------------- |
| `topbarHeight`     | `AdaptiveTopbarProvider`       | Platform detection, sidebar side |
| `topbarVisible`    | `AdaptiveTopbarProvider`       | Fullscreen enter/exit            |
| `sidebarWidth`     | `recordedSidebarSizeRef`       | User drag, sidebar toggle        |
| `sidebarSide`      | Settings (`sidebarSide`)       | User preference change           |
| `sidebarVisible`   | `BrowserSidebarProvider`       | Toggle, floating trigger         |
| `sidebarAnimating` | `BrowserSidebarProvider`       | Mount/unmount 100ms animation    |
| `outerPadding`     | Fixed at `12` (Tailwind `p-3`) | Never (unless redesigned)        |

Instead of measuring the DOM and sending pixel coordinates, the renderer sends
these parameters to the main process. The main process computes bounds
arithmetically from `getContentSize()` and the parameters, eliminating
`getBoundingClientRect()` from the critical path entirely.

---

## Layout Geometry

The current CSS layout (from `main.tsx`) produces bounds as follows. All units
are pixels; `cw` and `ch` are from `BrowserWindow.getContentSize()`.

```
topbarVisible = true:

  ┌──────────────────────────── cw ────────────────────────────┐
  │  AdaptiveTopbar  (height = topbarHeight)                   │
  ├────────────────────────────────────────────────────────────┤
  │        │ pad │                          │ pad │            │
  │ [side] │ 12  │     BrowserContent      │ 12  │ [sidebar]  │
  │ [bar ] │     │       (flex-1)          │     │ [or pad ]  │
  │ [or  ] │     │                          │     │            │
  │ [pad ] │     │    ← tab views go here → │     │            │
  │        │     │                          │     │            │
  │        │     │      (with pt-0)         │     │            │
  │        │     │                          │     │            │
  ├────────┴─────┴──────────────────────────┴─────┴────────────┤
  │  bottom padding (12px from py-3)                           │
  └────────────────────────────────────────────────────────────┘

topbarVisible = false (macOS, sidebar on left):

  ┌──────────────────────────── cw ────────────────────────────┐
  │        │ pad │                          │ pad │            │
  │ [side] │ 12  │     BrowserContent      │ 12  │  pad 12   │
  │ [bar ] │     │       (flex-1)          │     │            │
  │        │     │      (with py-3)         │     │            │
  │        │     │                          │     │            │
  ├────────┴─────┴──────────────────────────┴─────┴────────────┤
  │  bottom padding (12px from py-3)                           │
  └────────────────────────────────────────────────────────────┘
```

**Attached sidebar:**

- Total sidebar footprint = `sidebarWidth + handleOrPadWidth`.
  - When sidebar is present: `sidebarWidth` (the `PixelBasedResizablePanel`
    pixel width) + a 12px resize handle area (the `SidebarResizeHandle`, which
    is `w-3`).
  - When sidebar is absent: a 12px spacer (`<div className="w-3" />`).
- During the sidebar hide animation, the panel applies a negative margin equal
  to `sidebarWidth`, collapsing it from `sidebarWidth` to `0` over 100ms. The
  handle/spacer stays at 12px throughout.

**Floating sidebar:**

- Rendered in a `PortalComponent` (separate overlay window). Zero layout impact
  on `BrowserContent`. The content area bounds do not change.

### Bounds formula

```
paddingH     = 12  (left spacer/handle + right spacer/handle)
paddingTop   = topbarVisible ? topbarHeight : 12
paddingBot   = 12

sidebarSpace = sidebarVisible ? effectiveSidebarWidth : 0
  where effectiveSidebarWidth lerps from 0 → sidebarWidth over animation

x      = (sidebarSide === "left" ? sidebarSpace : 0) + 12
y      = paddingTop
width  = cw - sidebarSpace - paddingH
height = ch - paddingTop - paddingBot
```

The `12` on both sides accounts for the spacer/handle divs (`w-3 = 12px`)
that always exist between the sidebar panel (or its absence) and the content.

---

## Sidebar Tween Handling

The attached sidebar uses a 100ms `ease-in-out` CSS `transition-[margin]`. The
sidebar's pixel width stays constant; a negative margin slides it off-screen.
From the layout's perspective, `BrowserContent` grows/shrinks as the margin
animates.

### Approach: main-process eased interpolation

When the renderer reports that a sidebar animation has started, the main
process interpolates `effectiveSidebarWidth` between the start and end values
over the same 100ms duration with the same `ease-in-out` timing function. This
mirrors the CSS transition exactly, so the `WebContentsView` tracks the content
area without any renderer round-trip during the animation.

The flow:

```
Renderer                                     Main Process
────────                                     ────────────
sidebar toggled
  → startAnimation()
  → send IPC: page:set-layout-params {        receives layout params
      ...,                                      with sidebarAnimating: true
      sidebarVisible: false,                    and sidebarVisible: false
      sidebarAnimating: true
    }
                                              starts 100ms interpolation:
                                                effectiveSidebarWidth:
                                                  sidebarWidth → 0
                                                using ease-in-out curve
                                                recomputing pageBounds
                                                each frame (~16ms ticks)

100ms later:                                  interpolation settles
  → stopAnimation()                             effectiveSidebarWidth = 0
  → send IPC: page:set-layout-params {
      ...,
      sidebarAnimating: false
    }
                                              confirms final state
```

The interpolation runs a `setTimeout`-based loop at ~4ms intervals (~25 ticks
per 100ms animation) in the main process, using **Tailwind's `ease-in-out`**
easing function: `cubic-bezier(0.4, 0, 0.2, 1)`. Note: this is NOT the CSS
standard `ease-in-out` keyword which is `cubic-bezier(0.42, 0, 0.58, 1)` —
Tailwind uses a different, front-loaded curve.

For opening, the interpolation goes `0 → sidebarWidth`. For closing,
`sidebarWidth → 0`. The direction is determined by the `sidebarVisible` flag
in the layout params.

**Floating sidebar:** No interpolation needed. The floating sidebar is an
overlay (`PortalComponent`) and does not affect `BrowserContent` bounds.

---

## New Shared Types

```typescript
// src/shared/flow/types.ts

export interface PageLayoutParams {
  /** Pixel height of the topbar (0 when not applicable, e.g. macOS with left sidebar). */
  topbarHeight: number;

  /** Whether the topbar is currently rendered. */
  topbarVisible: boolean;

  /** Pixel width of the sidebar panel (not including the handle/spacer). */
  sidebarWidth: number;

  /** Which side the sidebar attaches to. */
  sidebarSide: "left" | "right";

  /**
   * Whether the attached sidebar is currently visible (taking up layout space).
   * Floating sidebars do not affect layout and should not change this flag.
   */
  sidebarVisible: boolean;

  /**
   * Whether the sidebar is currently animating (opening or closing).
   * When true, the main process interpolates effectiveSidebarWidth between
   * the previous and target values over 100ms with ease-in-out timing.
   */
  sidebarAnimating: boolean;
}
```

---

## New IPC Channel

### `page:set-layout-params`

Replaces `page:set-bounds` for the primary page bounds flow.

- **Direction:** Renderer -> Main (fire-and-forget, `ipcRenderer.send`)
- **Payload:** `PageLayoutParams`
- **When sent:**
  - On initial mount (once layout parameters are known)
  - When sidebar visibility changes (toggle on/off)
  - When sidebar animation starts or ends
  - When sidebar is resized by the user (drag handle)
  - When sidebar side setting changes
  - When topbar height/visibility changes (unlikely at runtime)
  - When fullscreen state changes

This is significantly less frequent than the current approach, which sends
updated bounds on every rAF tick during any layout change.

---

## Main Process Changes

### `BrowserWindowInstance` (browser.ts)

Replace the current `pageBounds` / `pageInsets` / `_isResizing` mechanism:

```typescript
class BrowserWindowInstance {
  // Remove:
  //   private pageInsets: { ... } | null = null;
  //   private _isResizing: boolean;
  //   private _resizeEndTimer: ...;

  // Add:
  private layoutParams: PageLayoutParams | null = null;
  private sidebarInterpolation: SidebarInterpolation | null = null;

  public setLayoutParams(params: PageLayoutParams): void {
    const prevParams = this.layoutParams;
    this.layoutParams = params;

    if (params.sidebarAnimating && prevParams) {
      // Start interpolation from previous effective width to new target
      const fromWidth = prevParams.sidebarVisible ? prevParams.sidebarWidth : 0;
      const toWidth = params.sidebarVisible ? params.sidebarWidth : 0;

      this.sidebarInterpolation = new SidebarInterpolation(
        fromWidth,
        toWidth,
        SIDEBAR_ANIMATE_DURATION, // 100ms, matching CSS
        () => {
          this.recomputePageBounds();
        },
        () => {
          // Animation complete callback
          this.sidebarInterpolation = null;
          this.recomputePageBounds();
        }
      );
      this.sidebarInterpolation.start();
    } else {
      // No animation — apply immediately
      if (this.sidebarInterpolation) {
        this.sidebarInterpolation.stop();
        this.sidebarInterpolation = null;
      }
      this.recomputePageBounds();
    }
  }

  private recomputePageBounds(): void {
    if (!this.layoutParams) return;

    const [cw, ch] = this.browserWindow.getContentSize();
    const { topbarHeight, topbarVisible, sidebarWidth, sidebarSide, sidebarVisible } = this.layoutParams;

    // Effective sidebar width (animated or static)
    let effectiveSidebarWidth: number;
    if (this.sidebarInterpolation) {
      effectiveSidebarWidth = this.sidebarInterpolation.currentValue;
    } else {
      effectiveSidebarWidth = sidebarVisible ? sidebarWidth : 0;
    }

    const PADDING = 12;
    const padTop = topbarVisible ? topbarHeight : PADDING;
    const padBottom = PADDING;

    const x = (sidebarSide === "left" ? effectiveSidebarWidth : 0) + PADDING;
    const y = padTop;
    const width = Math.max(0, cw - effectiveSidebarWidth - PADDING * 2);
    const height = Math.max(0, ch - padTop - padBottom);

    const newBounds: PageBounds = { x, y, width, height };
    this.pageBounds = newBounds;
    this.emit("page-bounds-changed", newBounds);
    tabsController.handlePageBoundsChanged(this.id);
  }
}
```

The `resize` event handler simplifies to:

```typescript
browserWindow.on("resize", () => {
  this.recomputePageBounds();
});
```

No `_isResizing` flag, no inset cache, no debounce timer.

### `SidebarInterpolation` class

A small utility that drives a value from A to B over a duration with
Tailwind's `ease-in-out` timing, ticking via `setTimeout` at ~4ms intervals
(~25 ticks per 100ms animation):

```typescript
const SIDEBAR_ANIMATE_DURATION = 100; // ms, matches CSS

class SidebarInterpolation {
  public currentValue: number;
  private startTime: number = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private from: number,
    private to: number,
    private duration: number,
    private onTick: () => void,
    private onComplete: () => void
  ) {
    this.currentValue = from;
  }

  start(): void {
    this.startTime = performance.now();
    this.currentValue = this.from;
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
    const eased = easeInOut(t);
    this.currentValue = this.from + (this.to - this.from) * eased;
    this.onTick();

    if (t < 1) {
      this.timer = setTimeout(this.tick, MS_PER_FRAME);
    } else {
      this.currentValue = this.to;
      this.onTick();
      this.timer = null;
      this.onComplete();
    }
  };
}

/** Tailwind ease-in-out: cubic-bezier(0.4, 0, 0.2, 1) */
function easeInOut(t: number): number {
  // The actual implementation uses a Newton-Raphson cubic-bezier solver
  // for exact matching. See sidebar-interpolation.ts.
  // This pseudocode shows the concept; the quadratic approximation below
  // does NOT match the Tailwind curve and is kept only for illustration.
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
```

---

## Renderer Changes

### `BrowserContent` (browser-content.tsx)

Remove `useBoundingRect` entirely. Replace with a `useEffect` that sends
layout parameters when they change:

```typescript
function BrowserContent() {
  const { mode, recordedSidebarSizeRef, isAnimating } = useBrowserSidebar();
  const { topbarHeight, topbarVisible } = useAdaptiveTopbar();

  const sidebarVisible = mode.startsWith("attached-");
  const sidebarSide = mode.includes("-left") ? "left" : mode.includes("-right") ? "right" : "left";

  useEffect(() => {
    const params: PageLayoutParams = {
      topbarHeight,
      topbarVisible,
      sidebarWidth: recordedSidebarSizeRef.current,
      sidebarSide,
      sidebarVisible,
      sidebarAnimating: isAnimating,
    };
    flow.page.setLayoutParams(params);
  }, [topbarHeight, topbarVisible, sidebarVisible, sidebarSide, isAnimating,
      recordedSidebarSizeRef]);

  return (
    <div className={cn("rounded-lg flex-1 relative remove-app-drag bg-white/20")} />
  );
}
```

The `useBoundingRect` hook is no longer imported here. The component becomes a
simple placeholder `<div>` for visual styling only.

### `useBoundingRect` hook

Not deleted. It is still used by:

- Portal components (`portal.tsx`) for overlay positioning
- Omnibox positioning (`address-bar.tsx`)
- macOS traffic light tracking (`macos.tsx`)
- Extension popup anchoring (`browser-action-provider.tsx`)
- Resizable panel pixel calculations (`resizable-extras.tsx`)

These use cases genuinely depend on dynamic DOM position and cannot be
replaced with a declarative model.

---

## Fullscreen Handling

When fullscreen is entered or exited, the renderer sends updated layout params
with `topbarVisible: false` (fullscreen hides the topbar). The main process
also detects fullscreen via the `enter-full-screen` / `leave-full-screen`
events and can immediately recompute bounds using `getContentSize()` with
`topbarVisible = false`, without waiting for the renderer.

The `TabLayoutManager` already has a fullscreen override that uses
`getContentSize()` directly (tab-layout.ts:111-113), so this path is
unaffected.

---

## Validation During Migration

During the transition, keep the old `page:set-bounds` IPC handler and add a
debug assertion that compares the renderer-measured bounds against the
main-process-computed bounds:

```typescript
// Temporary validation (remove after confidence period)
ipcMain.on("page:set-bounds", (event, rendererBounds: PageBounds) => {
  const window = getWindow(event.sender);
  if (!window) return;

  const computed = window.pageBounds;
  const dx = Math.abs(computed.x - rendererBounds.x);
  const dy = Math.abs(computed.y - rendererBounds.y);
  const dw = Math.abs(computed.width - rendererBounds.width);
  const dh = Math.abs(computed.height - rendererBounds.height);

  if (dx > 2 || dy > 2 || dw > 2 || dh > 2) {
    console.warn("[page-bounds] Mismatch!", { computed, rendererBounds });
  }
});
```

This lets you verify the declarative model matches reality before removing the
old code path.

---

## Summary of Changes

| Component                      | Before                                                 | After                                                      |
| ------------------------------ | ------------------------------------------------------ | ---------------------------------------------------------- |
| `BrowserContent`               | `useBoundingRect` + `getBoundingClientRect` rAF loop   | `useLayoutEffect` sends `PageLayoutParams` on state change |
| `browser.ts` `setPageBounds`   | Stores bounds, caches insets, `_isResizing` debounce   | Removed                                                    |
| `browser.ts` `setLayoutParams` | N/A                                                    | Computes bounds from params + `getContentSize()`           |
| `browser.ts` resize handler    | Recomputes from cached insets with `_isResizing` guard | Calls `recomputePageBounds()` directly                     |
| Sidebar tween                  | Bounds lag behind CSS animation                        | Main-process 100ms ease-in-out interpolation               |
| Floating sidebar               | No change needed                                       | No change needed                                           |
| Fullscreen                     | Clears insets, waits for renderer                      | Detects via event, recomputes immediately                  |
| IPC frequency                  | ~60 calls/sec during any layout change                 | ~1-5 calls per structural change                           |
| `useBoundingRect` hook         | Used by `BrowserContent`                               | Removed from `BrowserContent`; kept for portals/omnibox    |

### Benefits

- **Zero `getBoundingClientRect` calls** on the critical page bounds path.
- **Zero renderer round-trip latency** for resize or sidebar toggle.
- **Pixel-perfect sidebar tween tracking** via synchronized interpolation.
- **Single source of truth** for page bounds: `recomputePageBounds()` in the
  main process.
- **~95% reduction in IPC traffic** for page bounds updates.
- **Simpler code:** no inset cache, no `_isResizing` flag, no debounce timer,
  no epsilon comparisons, no settle-frame heuristics.

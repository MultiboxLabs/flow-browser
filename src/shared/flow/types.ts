export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Declarative layout parameters sent from the renderer to the main process.
 * The main process computes PageBounds arithmetically from these parameters
 * and `BrowserWindow.getContentSize()`, eliminating `getBoundingClientRect()`
 * from the critical page bounds path.
 *
 * See design/DECLARATIVE_PAGE_BOUNDS.md for the full design.
 */
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

  /**
   * Extra vertical offset (in pixels) consumed by renderer-only UI above
   * the content area (e.g. the popup window toolbar). The main process adds
   * this to the top padding when computing page bounds.  Defaults to 0.
   */
  contentTopOffset: number;

  // --- Ripple sidebar (always on the opposite side of sidebarSide) ---

  /** Pixel width of the Ripple sidebar panel. */
  rippleSidebarWidth: number;

  /**
   * Whether the Ripple sidebar is currently visible (taking up layout space).
   */
  rippleSidebarVisible: boolean;

  /**
   * Whether the Ripple sidebar is currently animating (opening or closing).
   * When true, the main process interpolates effectiveRippleSidebarWidth
   * between the previous and target values over 100ms with ease-in-out timing.
   */
  rippleSidebarAnimating: boolean;
}

export type WindowState = {
  isMaximized: boolean;
  isFullscreen: boolean;
};

export type IPCListener<T extends unknown[]> = (callback: (...data: T) => void) => () => void;

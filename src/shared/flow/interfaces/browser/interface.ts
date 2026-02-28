import { IPCListener, PageBounds, WindowState } from "~/flow/types";

/** Fired by the main-process cursor monitor when the pointer enters or leaves a window edge. */
export type CursorEdgeEvent = {
  /** Which edge the cursor is near, or `null` when it leaves every edge. */
  edge: "left" | "right" | null;
  /** Cursor x in window-local CSS coordinates. */
  x: number;
};

// API //
export interface FlowInterfaceAPI {
  /**
   * Sets the position of the window button
   * This can only be called from the Browser UI
   * @param position The position object containing x and y coordinates
   */
  setWindowButtonPosition: (position: { x: number; y: number }) => void;

  /**
   * Sets the visibility of the window button
   * This can only be called from the Browser UI
   * @param visible Whether the window button should be visible
   */
  setWindowButtonVisibility: (visible: boolean) => void;

  /**
   * Adds a callback to be called when the sidebar is toggled
   */
  onToggleSidebar: IPCListener<[void]>;

  /**
   * Adds a callback to be called when the cursor enters or leaves a window edge.
   * Used by the floating sidebar trigger since tab WebContentsViews consume
   * mouse events and prevent the chrome renderer from seeing them.
   */
  onCursorAtEdge: IPCListener<[CursorEdgeEvent]>;

  /**
   * Sets the bounds of a component window
   */
  setComponentWindowBounds: (componentId: string, bounds: PageBounds) => void;

  /**
   * Sets the z-index of a component window
   */
  setComponentWindowZIndex: (componentId: string, zIndex: number) => void;

  /**
   * Sets the visibility of a component window
   */
  setComponentWindowVisible: (componentId: string, visible: boolean) => void;

  /**
   * Focuses a component window's webContents so it receives keyboard input
   */
  focusComponentWindow: (componentId: string) => void;

  /**
   * Moves popup window by a specific amount
   */
  moveWindowBy: (x: number, y: number) => void;

  /**
   * Moves popup window to a specific position
   */
  moveWindowTo: (x: number, y: number) => void;

  /**
   * Resizes popup window by a specific amount
   */
  resizeWindowBy: (width: number, height: number) => void;

  /**
   * Resizes popup window to a specific size
   */
  resizeWindowTo: (width: number, height: number) => void;

  /**
   * Minimizes the window
   */
  minimizeWindow: () => void;

  /**
   * Maximizes the window
   */
  maximizeWindow: () => void;

  /**
   * Closes the window
   */
  closeWindow: () => void;

  /**
   * Gets the state of the window
   */
  getWindowState: () => Promise<WindowState>;

  /**
   * Adds a callback to be called when the window state changes
   */
  onWindowStateChanged: IPCListener<[WindowState]>;
}

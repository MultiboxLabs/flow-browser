import { IPCListener, PageBounds, WindowState } from "~/flow/types";

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

import { IPCListener, WindowState } from "~/flow/types";

// API //
export interface FlowWindowsAPI {
  /**
   * Opens the settings window
   */
  openSettingsWindow: () => void;

  /**
   * Closes the settings window
   */
  closeSettingsWindow: () => void;

  // Generic window controls — work for any internal window (browser, settings, etc.)

  /**
   * Minimizes the current window
   */
  minimizeCurrentWindow: () => void;

  /**
   * Toggles maximize/restore on the current window
   */
  maximizeCurrentWindow: () => void;

  /**
   * Closes the current window
   */
  closeCurrentWindow: () => void;

  /**
   * Gets the current window's state (maximized, fullscreen)
   */
  getCurrentWindowState: () => Promise<WindowState>;

  /**
   * Listens for window state changes on the current window
   */
  onCurrentWindowStateChanged: IPCListener<[WindowState]>;
}

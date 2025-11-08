// This is for other controllers to interface with the browser windows
import { windowsController } from "@/controllers/windows-controller";
import type { BrowserWindowCreationOptions, BrowserWindowType } from "@/controllers/windows-controller/types/browser";
import { waitForElectronComponentsToBeReady } from "@/modules/electron-components";
import { debugPrint } from "@/modules/output";
import { app, type WebContents } from "electron";

const browserWindowsManager = () => windowsController.browser;
let printedWidevineNotReady: boolean = false;

function warnWidevineLoadFailed() {
  if (!printedWidevineNotReady) {
    debugPrint("INITIALIZATION", "WidevineCDM failed to initialize");
    printedWidevineNotReady = true;
  }
}

async function waitUntilReady() {
  // Wait for electron to finish initializing
  await app.whenReady();

  // Wait for WidevineCDM to be ready
  // Could fail when Widevine is not available, but we don't care
  const isReady = await waitForElectronComponentsToBeReady();
  if (!isReady) {
    warnWidevineLoadFailed();
  }
}

export const browserWindowsController = {
  /**
   * Uses browserWindowsManager.instantCreate, but waits for essential components to be ready first.
   */
  create: async (type: BrowserWindowType = "normal", options: BrowserWindowCreationOptions = {}) => {
    await waitUntilReady();
    return browserWindowsController.instantCreate(type, options);
  },

  /**
   * Creates a new window without waiting for Electron to be ready
   * Only use this if you're confident that Electron + Widevine are already ready!
   */
  instantCreate: (type: BrowserWindowType = "normal", options: BrowserWindowCreationOptions = {}) => {
    return browserWindowsManager().new(type, options);
  },

  /**
   * Gets all windows
   */
  getWindows: () => {
    return browserWindowsManager().getAll();
  },

  /**
   * Gets the focused window
   */
  getFocusedWindow: () => {
    return browserWindowsManager().getFocused();
  },

  /**
   * Gets a window by its ID
   */
  getWindowById: (id: number) => {
    return browserWindowsManager().getById(id);
  },

  /**
   * Gets a window from its WebContents
   */
  getWindowFromWebContents: (webContents: WebContents) => {
    return browserWindowsManager().getFromWebContents(webContents);
  },

  /**
   * Destroys all windows
   * @param force Whether to force destroy the windows (Default: false)
   * @returns Whether the windows were destroyed
   */
  destroyAll: (force: boolean = false) => {
    const windows = browserWindowsManager().getAll();
    for (const window of windows) {
      window.destroy(force);
    }
  }
};

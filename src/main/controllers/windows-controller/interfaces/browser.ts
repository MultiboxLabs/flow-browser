// This is for other controllers to interface with the browser windows
import { windowsController } from "@/controllers/windows-controller";
import { BrowserWindowType } from "@/controllers/windows-controller/types/browser";
import { type WebContents } from "electron";

const browserWindowsManager = windowsController.browser;

export const browserWindowsController = {
  new: (type: BrowserWindowType = "normal") => {
    return browserWindowsManager.new(undefined, type);
  },

  getWindows: () => {
    return browserWindowsManager.getAll();
  },

  getFocusedWindow: () => {
    return browserWindowsManager.getFocused();
  },

  getWindowById: (id: string) => {
    return browserWindowsManager.getById(id);
  },

  getWindowFromWebContents: (webContents: WebContents) => {
    return browserWindowsManager.getFromWebContents(webContents);
  },

  destroyAll: (force: boolean = false) => {
    const windows = browserWindowsManager.getAll();
    for (const window of windows) {
      window.destroy(force);
    }
  }
};

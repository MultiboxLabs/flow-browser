import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";

const isBrowserUI = location.protocol === "chrome-extension:" && location.pathname === "/main/index.html";

if (isBrowserUI) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

// Listen for change to dimensions
contextBridge.exposeInMainWorld("flow", {
  // Browser UI Only //
  interface: {
    setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
      if (!isBrowserUI) return;
      return ipcRenderer.send("set-page-bounds", bounds);
    },
    setWindowButtonPosition: (position: { x: number; y: number }) => {
      if (!isBrowserUI) return;
      return ipcRenderer.send("set-window-button-position", position);
    },
    setWindowButtonVisibility: (visible: boolean) => {
      if (!isBrowserUI) return;
      return ipcRenderer.send("set-window-button-visibility", visible);
    },
    getTabNavigationStatus: (tabId: number) => {
      if (!isBrowserUI) return;
      return ipcRenderer.invoke("get-tab-navigation-status", tabId);
    },
    stopLoadingTab: (tabId: number) => {
      if (!isBrowserUI) return;
      return ipcRenderer.send("stop-loading-tab", tabId);
    },
    goToNavigationEntry: (tabId: number, index: number) => {
      if (!isBrowserUI) return;
      return ipcRenderer.send("go-to-navigation-entry", tabId, index);
    }
  }
});

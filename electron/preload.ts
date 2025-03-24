import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";

const isBrowserUI = location.protocol === "chrome-extension:" && location.pathname === "/main/index.html";
const isOmniboxUI = location.protocol === "chrome-extension:" && location.pathname === "/omnibox/index.html";

const canUseInterfaceAPI = isBrowserUI;
const canUseOmniboxAPI = isBrowserUI || isOmniboxUI;

if (isBrowserUI) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

// Listen for change to dimensions
contextBridge.exposeInMainWorld("flow", {
  // Browser UI Only //
  interface: {
    setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.send("set-page-bounds", bounds);
    },
    setWindowButtonPosition: (position: { x: number; y: number }) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.send("set-window-button-position", position);
    },
    setWindowButtonVisibility: (visible: boolean) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.send("set-window-button-visibility", visible);
    },
    getTabNavigationStatus: (tabId: number) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.invoke("get-tab-navigation-status", tabId);
    },
    stopLoadingTab: (tabId: number) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.send("stop-loading-tab", tabId);
    },
    goToNavigationEntry: (tabId: number, index: number) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.send("go-to-navigation-entry", tabId, index);
    },
    getPlatform: () => {
      if (!canUseInterfaceAPI) return;
      return process.platform;
    },
    onToggleSidebar: (callback: () => void) => {
      if (!canUseInterfaceAPI) return;
      return ipcRenderer.on("toggle-sidebar", (_event) => {
        callback();
      });
    }
  },
  omnibox: {
    show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
      if (!canUseOmniboxAPI) return;
      return ipcRenderer.send("show-omnibox", bounds, params);
    },
    hide: () => {
      if (!canUseOmniboxAPI) return;
      return ipcRenderer.send("hide-omnibox");
    }
  }
});

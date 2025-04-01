import { ProfileData } from "@/modules/profiles";
import { NewTabMode } from "@/saving/settings";
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";

const isBrowserUI = location.protocol === "chrome-extension:" && location.pathname === "/main/index.html";
const isOmniboxUI = location.protocol === "chrome-extension:" && location.pathname === "/omnibox/index.html";
const isSettingsUI = location.protocol === "flow-utility:" && location.pathname === "/settings/";

const canUseInterfaceAPI = isBrowserUI;
const canUseOmniboxAPI = isBrowserUI || isOmniboxUI;
const canUseSettingsAPI = isBrowserUI || isSettingsUI;

if (isBrowserUI) {
  // Inject <browser-action-list> element into WebUI
  injectBrowserAction();
}

function getOSFromPlatform(platform: NodeJS.Platform) {
  switch (platform) {
    case "darwin":
      return "macOS";
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return "Unknown";
  }
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
      const listener = ipcRenderer.on("toggle-sidebar", (_event) => {
        callback();
      });

      return () => {
        listener.removeListener("toggle-sidebar", callback);
      };
    }
  },

  // Omnibox UI Only //
  omnibox: {
    show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
      if (!canUseOmniboxAPI) return;
      return ipcRenderer.send("show-omnibox", bounds, params);
    },
    hide: () => {
      if (!canUseOmniboxAPI) return;
      return ipcRenderer.send("hide-omnibox");
    }
  },

  // Settings UI Only //
  settings: {
    open: () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.send("settings:open");
    },
    close: () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.send("settings:close");
    },
    getAppInfo: async () => {
      if (!canUseSettingsAPI) return;

      const appInfo: {
        version: string;
        packaged: boolean;
      } = await ipcRenderer.invoke("get-app-info");
      const appVersion = appInfo.version;
      const updateChannel: "Stable" | "Beta" | "Alpha" | "Development" = appInfo.packaged ? "Stable" : "Development";
      const os = getOSFromPlatform(process.platform);

      return {
        app_version: appVersion,
        build_number: appVersion,
        node_version: process.versions.node,
        chrome_version: process.versions.chrome,
        electron_version: process.versions.electron,
        os: os,
        update_channel: updateChannel
      };
    },

    // Settings: Icons //
    getIcons: async () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("get-icons");
    },
    isPlatformSupportedForIcon: async () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("icon:is-platform-supported");
    },
    getCurrentIcon: async () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("get-current-icon-id");
    },
    setCurrentIcon: async (iconId: string) => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("set-current-icon-id", iconId);
    },

    // Settings: New Tab Mode //
    getCurrentNewTabMode: async () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("get-current-new-tab-mode");
    },
    setCurrentNewTabMode: async (newTabMode: NewTabMode) => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("set-current-new-tab-mode", newTabMode);
    },

    // Settings: Profiles //
    getProfiles: async () => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("profiles:get-all");
    },
    createProfile: async (profileName: string) => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("profiles:create", profileName);
    },
    updateProfile: async (profileId: string, profileData: Partial<ProfileData>) => {
      if (!canUseSettingsAPI) return;
      return ipcRenderer.invoke("profiles:update", profileId, profileData);
    }
  }
});

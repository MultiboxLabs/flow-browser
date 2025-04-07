// This file will be super large and complex, so
// make sure to keep it clean and organized.

// IMPORTS //
import { ProfileData } from "@/sessions/profiles";
import { NewTabMode } from "@/saving/settings";
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";
import { SpaceData } from "@/sessions/spaces";

// API CHECKS //
const isBrowserUI = location.protocol === "flow-internal:" && location.pathname === "/main/"; // location.protocol === "chrome-extension:" && location.pathname === "/main/index.html";
const isOmniboxUI = location.protocol === "chrome-extension:" && location.pathname === "/omnibox/index.html";
const isSettingsUI = location.protocol === "flow-utility:" && location.pathname === "/settings/";

const canUseInterfaceAPI = isBrowserUI;
const canUseOmniboxAPI = isBrowserUI || isOmniboxUI;
const canUseSettingsAPI = isBrowserUI || isSettingsUI;

// BROWSER ACTION //
// Inject <browser-action-list> element into WebUI
if (isBrowserUI) {
  injectBrowserAction();
}

// INTERNAL FUNCTIONS //
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

// INTERFACE API //
const interfaceAPI = {
  setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.send("page:set-bounds", bounds);
  },
  setWindowButtonPosition: (position: { x: number; y: number }) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.send("window-button:set-position", position);
  },
  setWindowButtonVisibility: (visible: boolean) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.send("window-button:set-visibility", visible);
  },
  getTabNavigationStatus: (tabId: number) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.invoke("navigation:get-tab-status", tabId);
  },
  stopLoadingTab: (tabId: number) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.send("navigation:stop-loading-tab", tabId);
  },
  goToNavigationEntry: (tabId: number, index: number) => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.send("navigation:go-to-entry", tabId, index);
  },
  onToggleSidebar: (callback: () => void) => {
    if (!canUseInterfaceAPI) return;
    const listener = ipcRenderer.on("sidebar:toggle", (_event) => {
      callback();
    });
    return () => {
      listener.removeListener("sidebar:toggle", callback);
    };
  }
};

// TABS API //
const tabsAPI = {
  getData: async () => {
    if (!canUseInterfaceAPI) return;
    return ipcRenderer.invoke("tabs:get-data");
  },
  onDataUpdated: (callback: (data: any) => void) => {
    if (!canUseInterfaceAPI) return;
    const listener = ipcRenderer.on("tabs:on-data-updated", (_event, data) => {
      callback(data);
    });
    return () => {
      listener.removeListener("tabs:on-data-updated", callback);
    };
  }
};

// PROFILES API //
const profilesAPI = {
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
  },
  deleteProfile: async (profileId: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("profiles:delete", profileId);
  }
};

// SPACES API //
const spacesAPI = {
  getSpaces: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:get-all");
  },
  getSpacesFromProfile: async (profileId: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:get-from-profile", profileId);
  },
  createSpace: async (profileId: string, spaceName: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:create", profileId, spaceName);
  },
  deleteSpace: async (profileId: string, spaceId: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:delete", profileId, spaceId);
  },
  updateSpace: async (profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:update", profileId, spaceId, spaceData);
  },
  setUsingSpace: async (profileId: string, spaceId: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:set-using", profileId, spaceId);
  },
  getLastUsedSpace: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("spaces:get-last-used");
  }
};

// APP API //
const appAPI = {
  getAppInfo: async () => {
    if (!canUseSettingsAPI) return;

    const appInfo: {
      version: string;
      packaged: boolean;
    } = await ipcRenderer.invoke("app:get-info");
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
  getPlatform: () => {
    if (!canUseInterfaceAPI) return;
    return process.platform;
  },

  // Icons
  getIcons: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("icons:get-all");
  },
  isPlatformSupportedForIcon: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("icons:is-platform-supported");
  },
  getCurrentIcon: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("icons:get-current-icon-id");
  },
  setCurrentIcon: async (iconId: string) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("icons:set-current-icon-id", iconId);
  }
};

// NEW TAB API //
const newTabAPI = {
  getCurrentNewTabMode: async () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("new-tab-mode:get");
  },
  setCurrentNewTabMode: async (newTabMode: NewTabMode) => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.invoke("new-tab-mode:set", newTabMode);
  }
};

// OMNIBOX API //
const omniboxAPI = {
  show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
    if (!canUseOmniboxAPI) return;
    return ipcRenderer.send("omnibox:show", bounds, params);
  },
  hide: () => {
    if (!canUseOmniboxAPI) return;
    return ipcRenderer.send("omnibox:hide");
  }
};

// SETTINGS API //
const settingsAPI = {
  open: () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.send("settings:open");
  },
  close: () => {
    if (!canUseSettingsAPI) return;
    return ipcRenderer.send("settings:close");
  }
};

// EXPOSE FLOW API //
contextBridge.exposeInMainWorld("flow", {
  // Interface APIs
  interface: interfaceAPI,
  tabs: tabsAPI,

  // Session APIs
  profiles: profilesAPI,
  spaces: spacesAPI,

  // App APIs
  app: appAPI,
  newTab: newTabAPI,

  // Windows APIs
  omnibox: omniboxAPI,
  settings: settingsAPI
});

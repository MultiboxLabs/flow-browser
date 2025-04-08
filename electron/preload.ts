// This file will be super large and complex, so
// make sure to keep it clean and organized.

// IMPORTS //
import { ProfileData } from "@/sessions/profiles";
import { NewTabMode } from "@/saving/settings";
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";
import { SpaceData } from "@/sessions/spaces";

// API CHECKS //
const isInternalUI = location.protocol === "flow-internal:";
const isUtilityUI = location.protocol === "flow-utility:";

const isBrowserUI = isInternalUI && location.pathname === "/main/";
const isOmniboxUI = isInternalUI && location.pathname === "/omnibox/";
const isSettingsUI = isInternalUI && location.pathname === "/settings/";

const canUseAPI = {
  browser: isBrowserUI,
  session: isBrowserUI || isSettingsUI,
  app: isBrowserUI || isSettingsUI,
  window: isBrowserUI || isSettingsUI
};

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

function listenOnIPCChannel(channel: string, callback: () => void) {
  const listener = ipcRenderer.on(channel, (_event) => {
    callback();
  });
  return () => {
    listener.removeListener(channel, callback);
  };
}

// BROWSER API //
const browserAPI = {
  loadProfile: async (profileId: string) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("browser:load-profile", profileId);
  },
  unloadProfile: async (profileId: string) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("browser:unload-profile", profileId);
  }
};

// TABS API //
const tabsAPI = {
  getData: async () => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.invoke("tabs:get-data");
  },
  onDataUpdated: (callback: (data: any) => void) => {
    if (!canUseAPI.browser) return;
    const listener = ipcRenderer.on("tabs:on-data-updated", (_event, data) => {
      callback(data);
    });
    return () => {
      listener.removeListener("tabs:on-data-updated", callback);
    };
  }
};

// PAGE API //
const pageAPI = {
  setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("page:set-bounds", bounds);
  }
};

// NAVIGATION API //
const navigationAPI = {
  getTabNavigationStatus: (tabId: number) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.invoke("navigation:get-tab-status", tabId);
  },
  stopLoadingTab: (tabId: number) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("navigation:stop-loading-tab", tabId);
  },
  goToNavigationEntry: (tabId: number, index: number) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("navigation:go-to-entry", tabId, index);
  }
};

// INTERFACE API //
const interfaceAPI = {
  setWindowButtonPosition: (position: { x: number; y: number }) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("window-button:set-position", position);
  },
  setWindowButtonVisibility: (visible: boolean) => {
    if (!canUseAPI.browser) return;
    return ipcRenderer.send("window-button:set-visibility", visible);
  },
  onToggleSidebar: (callback: () => void) => {
    if (!canUseAPI.browser) return;
    return listenOnIPCChannel("sidebar:on-toggle", callback);
  }
};

// PROFILES API //
const profilesAPI = {
  getProfiles: async () => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("profiles:get-all");
  },
  createProfile: async (profileName: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("profiles:create", profileName);
  },
  updateProfile: async (profileId: string, profileData: Partial<ProfileData>) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("profiles:update", profileId, profileData);
  },
  deleteProfile: async (profileId: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("profiles:delete", profileId);
  }
};

// SPACES API //
const spacesAPI = {
  getSpaces: async () => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:get-all");
  },
  getSpacesFromProfile: async (profileId: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:get-from-profile", profileId);
  },
  createSpace: async (profileId: string, spaceName: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:create", profileId, spaceName);
  },
  deleteSpace: async (profileId: string, spaceId: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:delete", profileId, spaceId);
  },
  updateSpace: async (profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:update", profileId, spaceId, spaceData);
  },
  setUsingSpace: async (profileId: string, spaceId: string) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:set-using", profileId, spaceId);
  },
  getLastUsedSpace: async () => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:get-last-used");
  },
  reorderSpaces: async (orderMap: { profileId: string; spaceId: string; order: number }[]) => {
    if (!canUseAPI.session) return;
    return ipcRenderer.invoke("spaces:reorder", orderMap);
  },
  onSpacesChanged: (callback: () => void) => {
    if (!canUseAPI.session) return;
    return listenOnIPCChannel("spaces:on-changed", callback);
  }
};

// APP API //
const appAPI = {
  getAppInfo: async () => {
    if (!canUseAPI.app) return;

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
    if (!canUseAPI.app) return;
    return process.platform;
  }
};

// ICONS API //
const iconsAPI = {
  getIcons: async () => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("icons:get-all");
  },
  isPlatformSupported: async () => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("icons:is-platform-supported");
  },
  getCurrentIcon: async () => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("icons:get-current-icon-id");
  },
  setCurrentIcon: async (iconId: string) => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("icons:set-current-icon-id", iconId);
  }
};

// NEW TAB API //
const newTabAPI = {
  getCurrentNewTabMode: async () => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("new-tab-mode:get");
  },
  setCurrentNewTabMode: async (newTabMode: NewTabMode) => {
    if (!canUseAPI.app) return;
    return ipcRenderer.invoke("new-tab-mode:set", newTabMode);
  }
};

// OMNIBOX API //
const omniboxAPI = {
  show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
    if (!canUseAPI.window) return;
    return ipcRenderer.send("omnibox:show", bounds, params);
  },
  hide: () => {
    if (!canUseAPI.window) return;
    return ipcRenderer.send("omnibox:hide");
  }
};

// SETTINGS API //
const settingsAPI = {
  open: () => {
    if (!canUseAPI.window) return;
    return ipcRenderer.send("settings:open");
  },
  close: () => {
    if (!canUseAPI.window) return;
    return ipcRenderer.send("settings:close");
  }
};

// EXPOSE FLOW API //
contextBridge.exposeInMainWorld("flow", {
  // Browser APIs
  browser: browserAPI,
  tabs: tabsAPI,
  page: pageAPI,
  navigation: navigationAPI,
  interface: interfaceAPI,

  // Session APIs
  profiles: profilesAPI,
  spaces: spacesAPI,

  // App APIs
  app: appAPI,
  icons: iconsAPI,
  newTab: newTabAPI,

  // Windows APIs
  omnibox: omniboxAPI,
  settings: settingsAPI
});

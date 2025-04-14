// This file will be super large and complex, so
// make sure to keep it clean and organized.

// IMPORTS //
import { ProfileData } from "@/sessions/profiles";
import { NewTabMode, SidebarCollapseMode } from "@/saving/settings";
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";
import { SpaceData } from "@/sessions/spaces";

// API CHECKS //
function checkCanUseAPI() {
  const isInternalUI = location.protocol === "flow-internal:";
  const isProtocolUI = location.protocol === "flow:";

  const isBrowserUI = isInternalUI && location.hostname === "main";
  const isOmniboxUI = isInternalUI && location.hostname === "omnibox";
  const isSettingsUI = isInternalUI && location.hostname === "settings";
  const isOnboardingUI = isInternalUI && location.hostname === "onboarding";

  const isNewTabPage = isProtocolUI && location.hostname === "new-tab";
  const isOmniboxDebugPage = isProtocolUI && location.hostname === "omnibox";

  const isOmnibox = isOmniboxUI || isNewTabPage || isOmniboxDebugPage;

  const canUseAPI = {
    browser: isBrowserUI || isOmnibox,
    session: isBrowserUI || isSettingsUI || isOmnibox,
    app: isBrowserUI || isSettingsUI || isOnboardingUI,
    window: isBrowserUI || isSettingsUI || isOmniboxUI
  };
  return canUseAPI;
}

// BROWSER ACTION //
// Inject <browser-action-list> element into WebUI
if (checkCanUseAPI().browser) {
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

function listenOnIPCChannel(channel: string, callback: (...args: any[]) => void) {
  const wrappedCallback = (_event: any, ...args: any[]) => {
    callback(...args);
  };

  ipcRenderer.on(channel, wrappedCallback);
  return () => {
    ipcRenderer.removeListener(channel, wrappedCallback);
  };
}

// BROWSER API //
const browserAPI = {
  loadProfile: async (profileId: string) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("browser:load-profile", profileId);
  },
  unloadProfile: async (profileId: string) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("browser:unload-profile", profileId);
  }
};

// TABS API //
const tabsAPI = {
  getData: async () => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.invoke("tabs:get-data");
  },
  onDataUpdated: (callback: (data: any) => void) => {
    if (!checkCanUseAPI().browser) return;
    return listenOnIPCChannel("tabs:on-data-changed", callback);
  },
  switchToTab: async (tabId: number) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.invoke("tabs:switch-to-tab", tabId);
  },
  newTab: async (spaceId?: string, url?: string, isForeground?: boolean) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.invoke("tabs:new-tab", spaceId, url, isForeground);
  },
  closeTab: async (tabId: number) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.invoke("tabs:close-tab", tabId);
  }
};

// PAGE API //
const pageAPI = {
  setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("page:set-bounds", bounds);
  }
};

// NAVIGATION API //
const navigationAPI = {
  getTabNavigationStatus: (tabId: number) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.invoke("navigation:get-tab-status", tabId);
  },
  stopLoadingTab: (tabId: number) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("navigation:stop-loading-tab", tabId);
  },
  goToNavigationEntry: (tabId: number, index: number) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("navigation:go-to-entry", tabId, index);
  }
};

// INTERFACE API //
const interfaceAPI = {
  setWindowButtonPosition: (position: { x: number; y: number }) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("window-button:set-position", position);
  },
  setWindowButtonVisibility: (visible: boolean) => {
    if (!checkCanUseAPI().browser) return;
    return ipcRenderer.send("window-button:set-visibility", visible);
  },
  onToggleSidebar: (callback: () => void) => {
    if (!checkCanUseAPI().browser) return;
    return listenOnIPCChannel("sidebar:on-toggle", callback);
  }
};

// PROFILES API //
const profilesAPI = {
  getProfiles: async () => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("profiles:get-all");
  },
  createProfile: async (profileName: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("profiles:create", profileName);
  },
  updateProfile: async (profileId: string, profileData: Partial<ProfileData>) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("profiles:update", profileId, profileData);
  },
  deleteProfile: async (profileId: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("profiles:delete", profileId);
  }
};

// SPACES API //
const spacesAPI = {
  getSpaces: async () => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:get-all");
  },
  getSpacesFromProfile: async (profileId: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:get-from-profile", profileId);
  },
  createSpace: async (profileId: string, spaceName: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:create", profileId, spaceName);
  },
  deleteSpace: async (profileId: string, spaceId: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:delete", profileId, spaceId);
  },
  updateSpace: async (profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:update", profileId, spaceId, spaceData);
  },
  setUsingSpace: async (profileId: string, spaceId: string) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:set-using", profileId, spaceId);
  },
  getUsingSpace: async () => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:get-using");
  },
  getLastUsedSpace: async () => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:get-last-used");
  },
  reorderSpaces: async (orderMap: { profileId: string; spaceId: string; order: number }[]) => {
    if (!checkCanUseAPI().session) return;
    return ipcRenderer.invoke("spaces:reorder", orderMap);
  },
  onSpacesChanged: (callback: () => void) => {
    if (!checkCanUseAPI().session) return;
    return listenOnIPCChannel("spaces:on-changed", callback);
  },
  onSetWindowSpace: (callback: (spaceId: string) => void) => {
    if (!checkCanUseAPI().session) return;
    return listenOnIPCChannel("spaces:on-set-window-space", callback);
  }
};

// APP API //
const appAPI = {
  getAppInfo: async () => {
    if (!checkCanUseAPI().app) return;

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
    if (!checkCanUseAPI().app) return;
    return process.platform;
  }
};

// ICONS API //
const iconsAPI = {
  getIcons: async () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("icons:get-all");
  },
  isPlatformSupported: async () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("icons:is-platform-supported");
  },
  getCurrentIcon: async () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("icons:get-current-icon-id");
  },
  setCurrentIcon: async (iconId: string) => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("icons:set-current-icon-id", iconId);
  }
};

// NEW TAB API //
const newTabAPI = {
  getCurrentNewTabMode: async () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("new-tab-mode:get");
  },
  setCurrentNewTabMode: async (newTabMode: NewTabMode) => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("new-tab-mode:set", newTabMode);
  },
  open: () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.send("new-tab:open");
  }
};

// OPEN EXTERNAL API //
const openExternalAPI = {
  getAlwaysOpenExternal: async () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("open-external:get");
  },
  unsetAlwaysOpenExternal: async (requestingURL: string, openingURL: string) => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.invoke("open-external:unset", requestingURL, openingURL);
  }
};

// ONBOARDING API //
const onboardingAPI = {
  finish: () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.send("onboarding:finish");
  },
  reset: () => {
    if (!checkCanUseAPI().app) return;
    return ipcRenderer.send("onboarding:reset");
  }
};

// OMNIBOX API //
const omniboxAPI = {
  show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.send("omnibox:show", bounds, params);
  },
  hide: () => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.send("omnibox:hide");
  }
};

// SETTINGS API //
const settingsAPI = {
  open: () => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.send("settings:open");
  },
  close: () => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.send("settings:close");
  },
  getSidebarCollapseMode: async () => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.invoke("settings:get-sidebar-collapse-mode");
  },
  setSidebarCollapseMode: async (mode: SidebarCollapseMode) => {
    if (!checkCanUseAPI().window) return;
    return ipcRenderer.invoke("settings:set-sidebar-collapse-mode", mode);
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
  openExternal: openExternalAPI,
  onboarding: onboardingAPI,

  // Windows APIs
  omnibox: omniboxAPI,
  settings: settingsAPI
});

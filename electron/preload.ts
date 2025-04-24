// This file will be super large and complex, so
// make sure to keep it clean and organized.

// IMPORTS //
import { ProfileData } from "@/sessions/profiles";
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";
import { SpaceData } from "@/sessions/spaces";
import { SharedExtensionData } from "~/types/extensions";

// API CHECKS //
function isProtocol(protocol: string) {
  return location.protocol === protocol;
}

function isLocation(protocol: string, hostname: string) {
  return location.protocol === protocol && location.hostname === hostname;
}

type Permission = "app" | "browser" | "session" | "settings";

function hasPermission(permission: Permission) {
  const isFlowProtocol = isProtocol("flow:");
  const isFlowInternalProtocol = isProtocol("flow-internal:");

  const isInternalProtocols = isFlowInternalProtocol || isFlowProtocol;

  // Browser UI
  const isMainUI = isLocation("flow-internal:", "main-ui");
  const isPopupUI = isLocation("flow-internal:", "popup-ui");
  const isBrowserUI = isMainUI || isPopupUI;

  // Windows
  const isNewTab = isLocation("flow:", "new-tab");
  const isOmniboxUI = isLocation("flow-internal:", "omnibox");
  const isOmniboxDebug = isLocation("flow:", "omnibox");
  const isOmnibox = isOmniboxUI || isNewTab || isOmniboxDebug;

  // Extensions
  const isExtensions = isLocation("flow:", "extensions");

  switch (permission) {
    case "app":
      return isInternalProtocols || isExtensions;
    case "browser":
      return isBrowserUI || isOmnibox;
    case "session":
      return isFlowInternalProtocol || isOmnibox || isBrowserUI;
    case "settings":
      return isInternalProtocols;
    default:
      return false;
  }
}

// BROWSER ACTION //
// Inject <browser-action-list> element into WebUI
if (hasPermission("browser")) {
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

/**
 * Generates a UUIDv4 string.
 * @returns A UUIDv4 string.
 */
function generateUUID(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

function listenOnIPCChannel(channel: string, callback: (...args: any[]) => void) {
  const wrappedCallback = (_event: any, ...args: any[]) => {
    callback(...args);
  };

  const listenerId = generateUUID();
  ipcRenderer.send("listeners:add", channel, listenerId);
  ipcRenderer.on(channel, wrappedCallback);
  return () => {
    ipcRenderer.send("listeners:remove", channel, listenerId);
    ipcRenderer.removeListener(channel, wrappedCallback);
  };
}

function wrapAPI<T extends object>(
  api: T,
  permission: Permission,
  overridePermissions?: {
    [key in keyof T]?: Permission;
  }
): T {
  const wrappedAPI = {} as T;

  for (const key in api) {
    const value = api[key];

    if (typeof value === "function") {
      // @ts-expect-error
      wrappedAPI[key] = (...args: any[]) => {
        let noPermission = false;

        if (overridePermissions?.[key]) {
          noPermission = !hasPermission(overridePermissions[key]);
        } else {
          noPermission = !hasPermission(permission);
        }

        if (noPermission) {
          throw new Error(`Permission denied: flow.${permission}.${key}()`);
        }

        return value(...args);
      };
    } else {
      wrappedAPI[key] = value;
    }
  }

  return wrappedAPI;
}

// BROWSER API //
const browserAPI = {
  loadProfile: async (profileId: string) => {
    return ipcRenderer.send("browser:load-profile", profileId);
  },
  unloadProfile: async (profileId: string) => {
    return ipcRenderer.send("browser:unload-profile", profileId);
  },
  createWindow: () => {
    return ipcRenderer.send("browser:create-window");
  }
};

// TABS API //
const tabsAPI = {
  getData: async () => {
    return ipcRenderer.invoke("tabs:get-data");
  },
  onDataUpdated: (callback: (data: any) => void) => {
    return listenOnIPCChannel("tabs:on-data-changed", callback);
  },
  switchToTab: async (tabId: number) => {
    return ipcRenderer.invoke("tabs:switch-to-tab", tabId);
  },
  newTab: async (spaceId?: string, url?: string, isForeground?: boolean) => {
    return ipcRenderer.invoke("tabs:new-tab", spaceId, url, isForeground);
  },
  closeTab: async (tabId: number) => {
    return ipcRenderer.invoke("tabs:close-tab", tabId);
  },

  // Special Exception: This is allowed on every tab, but very tightly secured.
  // It will only work if the tab is currently in Picture-in-Picture mode.
  disablePictureInPicture: async () => {
    return ipcRenderer.invoke("tabs:disable-picture-in-picture");
  }
};

// PAGE API //
const pageAPI = {
  setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    return ipcRenderer.send("page:set-bounds", bounds);
  }
};

// NAVIGATION API //
const navigationAPI = {
  getTabNavigationStatus: (tabId: number) => {
    return ipcRenderer.invoke("navigation:get-tab-status", tabId);
  },
  goTo: (tabId: number, url: string) => {
    return ipcRenderer.send("navigation:go-to", tabId, url);
  },
  stopLoadingTab: (tabId: number) => {
    return ipcRenderer.send("navigation:stop-loading-tab", tabId);
  },
  reloadTab: (tabId: number) => {
    return ipcRenderer.send("navigation:reload-tab", tabId);
  },
  goToNavigationEntry: (tabId: number, index: number) => {
    return ipcRenderer.send("navigation:go-to-entry", tabId, index);
  }
};

// INTERFACE API //
const interfaceAPI = {
  setWindowButtonPosition: (position: { x: number; y: number }) => {
    return ipcRenderer.send("window-button:set-position", position);
  },
  setWindowButtonVisibility: (visible: boolean) => {
    return ipcRenderer.send("window-button:set-visibility", visible);
  },
  onToggleSidebar: (callback: () => void) => {
    return listenOnIPCChannel("sidebar:on-toggle", callback);
  }
};

// PROFILES API //
const profilesAPI = {
  getProfiles: async () => {
    return ipcRenderer.invoke("profiles:get-all");
  },
  createProfile: async (profileName: string) => {
    return ipcRenderer.invoke("profiles:create", profileName);
  },
  updateProfile: async (profileId: string, profileData: Partial<ProfileData>) => {
    return ipcRenderer.invoke("profiles:update", profileId, profileData);
  },
  deleteProfile: async (profileId: string) => {
    return ipcRenderer.invoke("profiles:delete", profileId);
  }
};

// SPACES API //
const spacesAPI = {
  getSpaces: async () => {
    return ipcRenderer.invoke("spaces:get-all");
  },
  getSpacesFromProfile: async (profileId: string) => {
    return ipcRenderer.invoke("spaces:get-from-profile", profileId);
  },
  createSpace: async (profileId: string, spaceName: string) => {
    return ipcRenderer.invoke("spaces:create", profileId, spaceName);
  },
  deleteSpace: async (profileId: string, spaceId: string) => {
    return ipcRenderer.invoke("spaces:delete", profileId, spaceId);
  },
  updateSpace: async (profileId: string, spaceId: string, spaceData: Partial<SpaceData>) => {
    return ipcRenderer.invoke("spaces:update", profileId, spaceId, spaceData);
  },
  setUsingSpace: async (profileId: string, spaceId: string) => {
    return ipcRenderer.invoke("spaces:set-using", profileId, spaceId);
  },
  getUsingSpace: async () => {
    return ipcRenderer.invoke("spaces:get-using");
  },
  getLastUsedSpace: async () => {
    return ipcRenderer.invoke("spaces:get-last-used");
  },
  reorderSpaces: async (orderMap: { profileId: string; spaceId: string; order: number }[]) => {
    return ipcRenderer.invoke("spaces:reorder", orderMap);
  },
  onSpacesChanged: (callback: () => void) => {
    return listenOnIPCChannel("spaces:on-changed", callback);
  },
  onSetWindowSpace: (callback: (spaceId: string) => void) => {
    return listenOnIPCChannel("spaces:on-set-window-space", callback);
  }
};

// APP API //
const appAPI = {
  getAppInfo: async () => {
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
    return process.platform;
  }
};

// ICONS API //
const iconsAPI = {
  getIcons: async () => {
    return ipcRenderer.invoke("icons:get-all");
  },
  isPlatformSupported: async () => {
    return ipcRenderer.invoke("icons:is-platform-supported");
  },
  getCurrentIcon: async () => {
    return ipcRenderer.invoke("icons:get-current-icon-id");
  },
  setCurrentIcon: async (iconId: string) => {
    return ipcRenderer.invoke("icons:set-current-icon-id", iconId);
  }
};

// NEW TAB API //
const newTabAPI = {
  open: () => {
    return ipcRenderer.send("new-tab:open");
  }
};

// OPEN EXTERNAL API //
const openExternalAPI = {
  getAlwaysOpenExternal: async () => {
    return ipcRenderer.invoke("open-external:get");
  },
  unsetAlwaysOpenExternal: async (requestingURL: string, openingURL: string) => {
    return ipcRenderer.invoke("open-external:unset", requestingURL, openingURL);
  }
};

// ONBOARDING API //
const onboardingAPI = {
  finish: () => {
    return ipcRenderer.send("onboarding:finish");
  },
  reset: () => {
    return ipcRenderer.send("onboarding:reset");
  }
};

// OMNIBOX API //
const omniboxAPI = {
  show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
    return ipcRenderer.send("omnibox:show", bounds, params);
  },
  hide: () => {
    return ipcRenderer.send("omnibox:hide");
  }
};

// SETTINGS API //
const settingsAPI = {
  getSetting: async (settingId: string) => {
    return ipcRenderer.invoke("settings:get-setting", settingId);
  },
  setSetting: async (settingId: string, value: unknown) => {
    return ipcRenderer.invoke("settings:set-setting", settingId, value);
  },
  getBasicSettings: async () => {
    return ipcRenderer.invoke("settings:get-basic-settings");
  },
  onSettingsChanged: (callback: () => void) => {
    return listenOnIPCChannel("settings:on-changed", callback);
  }
};

// WINDOWS API //
const windowsAPI = {
  openSettingsWindow: () => {
    return ipcRenderer.send("settings:open");
  },
  closeSettingsWindow: () => {
    return ipcRenderer.send("settings:close");
  }
};

// EXTENSIONS API //
const extensionsAPI = {
  getAllInCurrentProfile: async () => {
    return ipcRenderer.invoke("extensions:get-all-in-current-profile");
  },
  onUpdated: (callback: (extensions: SharedExtensionData[]) => void) => {
    return listenOnIPCChannel("extensions:on-updated", callback);
  },
  setExtensionEnabled: async (extensionId: string, enabled: boolean) => {
    return ipcRenderer.invoke("extensions:set-extension-enabled", extensionId, enabled);
  }
};

// EXPOSE FLOW API //
contextBridge.exposeInMainWorld("flow", {
  // App APIs
  app: wrapAPI(appAPI, "app"),
  windows: wrapAPI(windowsAPI, "app"),
  extensions: wrapAPI(extensionsAPI, "app"),

  // Browser APIs
  browser: wrapAPI(browserAPI, "browser"),
  tabs: wrapAPI(tabsAPI, "browser"),
  page: wrapAPI(pageAPI, "browser"),
  navigation: wrapAPI(navigationAPI, "browser"),
  interface: wrapAPI(interfaceAPI, "browser"),
  omnibox: wrapAPI(omniboxAPI, "browser"),
  newTab: wrapAPI(newTabAPI, "browser"),

  // Session APIs
  profiles: wrapAPI(profilesAPI, "session"),
  spaces: wrapAPI(spacesAPI, "session"),

  // Settings APIs
  settings: wrapAPI(settingsAPI, "settings"),
  icons: wrapAPI(iconsAPI, "settings"),
  openExternal: wrapAPI(openExternalAPI, "settings"),
  onboarding: wrapAPI(onboardingAPI, "settings")
});

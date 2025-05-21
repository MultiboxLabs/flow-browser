// This file will be super large and complex, so
// make sure to keep it clean and organized.

// IMPORTS //
import { contextBridge, ipcRenderer } from "electron";
import { injectBrowserAction } from "electron-chrome-extensions/browser-action";

// TYPE IMPORTS //
import type { ProfileData } from "@/sessions/profiles";
import type { SpaceData } from "@/sessions/spaces";

// SHARED TYPES //
import type { SharedExtensionData } from "~/types/extensions";
import type { WindowTabsData } from "~/types/tabs";
import type { UpdateStatus } from "~/types/updates";

// API TYPES //
import { FlowBrowserAPI } from "~/flow/interfaces/browser/browser";
import { FlowPageAPI } from "~/flow/interfaces/browser/page";
import { FlowNavigationAPI } from "~/flow/interfaces/browser/navigation";
import { FlowInterfaceAPI } from "~/flow/interfaces/browser/interface";
import { FlowProfilesAPI } from "~/flow/interfaces/sessions/profiles";
import { FlowSpacesAPI } from "~/flow/interfaces/sessions/spaces";
import { FlowAppAPI } from "~/flow/interfaces/app/app";
import { FlowIconsAPI } from "~/flow/interfaces/settings/icons";
import { FlowNewTabAPI } from "~/flow/interfaces/browser/newTab";
import { FlowOpenExternalAPI } from "~/flow/interfaces/settings/openExternal";
import { FlowOnboardingAPI } from "~/flow/interfaces/settings/onboarding";
import { FlowOmniboxAPI } from "~/flow/interfaces/browser/omnibox";
import { FlowSettingsAPI } from "~/flow/interfaces/settings/settings";
import { FlowWindowsAPI } from "~/flow/interfaces/app/windows";
import { FlowExtensionsAPI } from "~/flow/interfaces/app/extensions";
import { FlowTabsAPI } from "~/flow/interfaces/browser/tabs";
import { FlowUpdatesAPI } from "~/flow/interfaces/app/updates";
import { FlowActionsAPI } from "~/flow/interfaces/app/actions";
import { FlowShortcutsAPI, ShortcutsData } from "~/flow/interfaces/app/shortcuts";

// API CHECKS //
function isProtocol(protocol: string) {
  return location.protocol === protocol;
}

function isLocation(protocol: string, hostname: string) {
  return location.protocol === protocol && location.hostname === hostname;
}

type Permission = "all" | "app" | "browser" | "session" | "settings";

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
    case "all":
      return true;
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

// POPUP POLYFILLS //
// Polyfill some methods for popup windows
function polyfillPopup() {
  window.moveBy = (x: number, y: number) => {
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("Invalid arguments: x and y must be provided as numbers");
    }

    flow.interface.moveWindowBy(x, y);
  };

  window.moveTo = (x: number, y: number) => {
    if (typeof x !== "number" || typeof y !== "number") {
      throw new Error("Invalid arguments: x and y must be provided as numbers");
    }

    flow.interface.moveWindowTo(x, y);
  };

  window.resizeBy = (width: number, height: number) => {
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error("Invalid arguments: width and height must be provided as numbers");
    }

    flow.interface.resizeWindowBy(width, height);
  };

  window.resizeTo = (width: number, height: number) => {
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error("Invalid arguments: width and height must be provided as numbers");
    }

    flow.interface.resizeWindowTo(width, height);
  };
}

contextBridge.executeInMainWorld({
  func: polyfillPopup
});

/**
 * Generates a UUIDv4 string.
 * @returns A UUIDv4 string.
 */
function generateUUID(): string {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function listenOnIPCChannel(channel: string, callback: (...args: any[]) => void) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // @ts-expect-error: annoying little type inconsistancies
      wrappedAPI[key] = (...args: unknown[]) => {
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
const browserAPI: FlowBrowserAPI = {
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
const tabsAPI: FlowTabsAPI = {
  getData: async () => {
    return ipcRenderer.invoke("tabs:get-data");
  },
  onDataUpdated: (callback: (data: WindowTabsData) => void) => {
    return listenOnIPCChannel("tabs:on-data-changed", callback);
  },
  switchToTab: async (tabId: number) => {
    return ipcRenderer.invoke("tabs:switch-to-tab", tabId);
  },
  closeTab: async (tabId: number) => {
    return ipcRenderer.invoke("tabs:close-tab", tabId);
  },

  showContextMenu: (tabId: number) => {
    return ipcRenderer.send("tabs:show-context-menu", tabId);
  },

  // Special Exception: This is allowed for all internal protocols.
  newTab: async (url?: string, isForeground?: boolean, spaceId?: string) => {
    return ipcRenderer.invoke("tabs:new-tab", url, isForeground, spaceId);
  },

  // Special Exception: This is allowed on every tab, but very tightly secured.
  // It will only work if the tab is currently in Picture-in-Picture mode.
  disablePictureInPicture: async (goBackToTab: boolean) => {
    return ipcRenderer.invoke("tabs:disable-picture-in-picture", goBackToTab);
  },
  
  setTabMuted: async (tabId: number, muted: boolean) => {
    return ipcRenderer.invoke("tabs:set-tab-muted", tabId, muted);
  }
};

// PAGE API //
const pageAPI: FlowPageAPI = {
  setPageBounds: (bounds: { x: number; y: number; width: number; height: number }) => {
    return ipcRenderer.send("page:set-bounds", bounds);
  }
};

// NAVIGATION API //
const navigationAPI: FlowNavigationAPI = {
  getTabNavigationStatus: (tabId: number) => {
    return ipcRenderer.invoke("navigation:get-tab-status", tabId);
  },
  goTo: (url: string, tabId?: number) => {
    return ipcRenderer.send("navigation:go-to", url, tabId);
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
const interfaceAPI: FlowInterfaceAPI = {
  setWindowButtonPosition: (position: { x: number; y: number }) => {
    return ipcRenderer.send("window-button:set-position", position);
  },
  setWindowButtonVisibility: (visible: boolean) => {
    return ipcRenderer.send("window-button:set-visibility", visible);
  },
  onToggleSidebar: (callback: () => void) => {
    return listenOnIPCChannel("sidebar:on-toggle", callback);
  },
  setComponentWindowBounds: (componentId: string, bounds: Electron.Rectangle) => {
    return ipcRenderer.send("interface:set-component-window-bounds", componentId, bounds);
  },
  setComponentWindowZIndex: (componentId: string, zIndex: number) => {
    return ipcRenderer.send("interface:set-component-window-z-index", componentId, zIndex);
  },
  setComponentWindowVisible: (componentId: string, visible: boolean) => {
    return ipcRenderer.send("interface:set-component-window-visible", componentId, visible);
  },

  // Special Exception: These are allowed on every tab, but very tightly secured.
  // They will only work in popup windows.
  moveWindowBy: async (x: number, y: number) => {
    return ipcRenderer.send("interface:move-window-by", x, y);
  },
  moveWindowTo: async (x: number, y: number) => {
    return ipcRenderer.send("interface:move-window-to", x, y);
  },
  resizeWindowBy: async (width: number, height: number) => {
    return ipcRenderer.send("interface:resize-window-by", width, height);
  },
  resizeWindowTo: async (width: number, height: number) => {
    return ipcRenderer.send("interface:resize-window-to", width, height);
  }
};

// PROFILES API //
const profilesAPI: FlowProfilesAPI = {
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
  },
  getUsingProfile: async () => {
    return ipcRenderer.invoke("profile:get-using");
  }
};

// SPACES API //
const spacesAPI: FlowSpacesAPI = {
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
const appAPI: FlowAppAPI = {
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
  writeTextToClipboard: (text: string) => {
    return ipcRenderer.send("app:write-text-to-clipboard", text);
  },
  setDefaultBrowser: async () => {
    return ipcRenderer.invoke("app:set-default-browser");
  },
  getDefaultBrowser: async () => {
    return ipcRenderer.invoke("app:get-default-browser");
  },

  // Special Exception: This is allowed for all pages everywhere.
  getPlatform: () => {
    return process.platform;
  }
};

// ICONS API //
const iconsAPI: FlowIconsAPI = {
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
const newTabAPI: FlowNewTabAPI = {
  open: () => {
    return ipcRenderer.send("new-tab:open");
  }
};

// OPEN EXTERNAL API //
const openExternalAPI: FlowOpenExternalAPI = {
  getAlwaysOpenExternal: async () => {
    return ipcRenderer.invoke("open-external:get");
  },
  unsetAlwaysOpenExternal: async (requestingURL: string, openingURL: string) => {
    return ipcRenderer.invoke("open-external:unset", requestingURL, openingURL);
  }
};

// ONBOARDING API //
const onboardingAPI: FlowOnboardingAPI = {
  finish: () => {
    return ipcRenderer.send("onboarding:finish");
  },
  reset: () => {
    return ipcRenderer.send("onboarding:reset");
  }
};

// OMNIBOX API //
const omniboxAPI: FlowOmniboxAPI = {
  show: (bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
    return ipcRenderer.send("omnibox:show", bounds, params);
  },
  hide: () => {
    return ipcRenderer.send("omnibox:hide");
  }
};

// SETTINGS API //
const settingsAPI: FlowSettingsAPI = {
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
const windowsAPI: FlowWindowsAPI = {
  openSettingsWindow: () => {
    return ipcRenderer.send("settings:open");
  },
  closeSettingsWindow: () => {
    return ipcRenderer.send("settings:close");
  }
};

// EXTENSIONS API //
const extensionsAPI: FlowExtensionsAPI = {
  getAllInCurrentProfile: async () => {
    return ipcRenderer.invoke("extensions:get-all-in-current-profile");
  },
  onUpdated: (callback: (profileId: string, extensions: SharedExtensionData[]) => void) => {
    return listenOnIPCChannel("extensions:on-updated", callback);
  },
  setExtensionEnabled: async (extensionId: string, enabled: boolean) => {
    return ipcRenderer.invoke("extensions:set-extension-enabled", extensionId, enabled);
  },
  uninstallExtension: async (extensionId: string) => {
    return ipcRenderer.invoke("extensions:uninstall-extension", extensionId);
  },
  setExtensionPinned: async (extensionId: string, pinned: boolean) => {
    return ipcRenderer.invoke("extensions:set-extension-pinned", extensionId, pinned);
  }
};

// UPDATES API //
const updatesAPI: FlowUpdatesAPI = {
  isAutoUpdateSupported: async () => {
    return ipcRenderer.invoke("updates:is-auto-update-supported");
  },
  getUpdateStatus: async () => {
    return ipcRenderer.invoke("updates:get-update-status");
  },
  onUpdateStatusChanged: (callback: (updateStatus: UpdateStatus) => void) => {
    return listenOnIPCChannel("updates:on-update-status-changed", callback);
  },
  checkForUpdates: async () => {
    return ipcRenderer.invoke("updates:check-for-updates");
  },
  downloadUpdate: async () => {
    return ipcRenderer.invoke("updates:download-update");
  },
  installUpdate: async () => {
    return ipcRenderer.invoke("updates:install-update");
  }
};

// ACTIONS API //
const actionsAPI: FlowActionsAPI = {
  onCopyLink: (callback: () => void) => {
    return listenOnIPCChannel("actions:on-copy-link", callback);
  },
  onIncomingAction: (callback: (action: string) => void) => {
    return listenOnIPCChannel("actions:on-incoming", callback);
  }
};

// SHORTCUTS API //
const shortcutsAPI: FlowShortcutsAPI = {
  getShortcuts: async () => {
    return ipcRenderer.invoke("shortcuts:get-all");
  },
  setShortcut: async (actionId: string, shortcut: string) => {
    return ipcRenderer.invoke("shortcuts:set", actionId, shortcut);
  },
  resetShortcut: async (actionId: string) => {
    return ipcRenderer.invoke("shortcuts:reset", actionId);
  },
  onShortcutsUpdated: (callback: (shortcuts: ShortcutsData) => void) => {
    return listenOnIPCChannel("shortcuts:on-updated", callback);
  }
};

// EXPOSE FLOW API //
const flowAPI: typeof flow = {
  // App APIs
  app: wrapAPI(appAPI, "app", {
    getPlatform: "all"
  }),
  windows: wrapAPI(windowsAPI, "app"),
  extensions: wrapAPI(extensionsAPI, "app"),
  updates: wrapAPI(updatesAPI, "app"),
  actions: wrapAPI(actionsAPI, "app"),
  shortcuts: wrapAPI(shortcutsAPI, "app"),

  // Browser APIs
  browser: wrapAPI(browserAPI, "browser"),
  tabs: wrapAPI(tabsAPI, "browser", {
    newTab: "app",
    disablePictureInPicture: "all"
  }),
  page: wrapAPI(pageAPI, "browser"),
  navigation: wrapAPI(navigationAPI, "browser"),
  interface: wrapAPI(interfaceAPI, "browser", {
    moveWindowTo: "all",
    resizeWindowTo: "all"
  }),
  omnibox: wrapAPI(omniboxAPI, "browser"),
  newTab: wrapAPI(newTabAPI, "browser"),

  // Session APIs
  profiles: wrapAPI(profilesAPI, "session", {
    getUsingProfile: "app"
  }),
  spaces: wrapAPI(spacesAPI, "session", {
    getUsingSpace: "app"
  }),

  // Settings APIs
  settings: wrapAPI(settingsAPI, "settings"),
  icons: wrapAPI(iconsAPI, "settings"),
  openExternal: wrapAPI(openExternalAPI, "settings"),
  onboarding: wrapAPI(onboardingAPI, "settings")
};
contextBridge.exposeInMainWorld("flow", flowAPI);

import { BrowserWindow, dialog, Session } from "electron";
import { getSession } from "@/browser/sessions";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getProfile, getProfilePath, ProfileData } from "@/sessions/profiles";
import { BrowserEvents } from "@/browser/events";
import { Browser } from "@/browser/browser";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { NEW_TAB_URL } from "@/browser/tabs/tab-manager";
import { ExtensionInstallStatus, installChromeWebStore } from "electron-chrome-web-store";
import path from "path";
import { setWindowSpace } from "@/ipc/session/spaces";
import { registerWindow, WindowType } from "@/modules/windows";
import { getSettingValueById } from "@/saving/settings";
import { ExtensionManager } from "@/modules/extensions/management";
import { transformUserAgentHeader } from "@/browser/utility/user-agent";

export const loadedProfileSessions: Set<Session> = new Set();

/**
 * Represents a loaded browser profile
 */
export type LoadedProfile = {
  readonly profileId: string;
  readonly profileData: ProfileData;
  readonly session: Session;
  readonly extensions: ElectronChromeExtensions;
  readonly extensionsManager: ExtensionManager;
  newTabUrl: string;
  unload: () => void;
};

type PopupView = {
  readonly POSITION_PADDING: number;
  readonly BOUNDS: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };

  browserWindow?: BrowserWindow;
  parent?: Electron.BaseWindow;
  extensionId: string;
};

/**
 * Manages browser profiles and their lifecycle
 */
export class ProfileManager {
  private readonly profiles: Map<string, LoadedProfile>;
  private readonly loadingProfiles: Map<string, Promise<boolean>>;
  private readonly eventEmitter: TypedEventEmitter<BrowserEvents>;
  private readonly browser: Browser;

  constructor(browser: Browser, eventEmitter: TypedEventEmitter<BrowserEvents>) {
    this.profiles = new Map();
    this.loadingProfiles = new Map();
    this.eventEmitter = eventEmitter;
    this.browser = browser;
  }

  /**
   * Gets a loaded profile by ID
   */
  public getProfile(profileId: string): LoadedProfile | undefined {
    return this.profiles.get(profileId);
  }

  /**
   * Gets all loaded profiles
   */
  public getProfiles(): LoadedProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Loads a profile by ID
   */
  public async loadProfile(profileId: string): Promise<boolean> {
    // If profile is already loaded, return immediately
    if (this.profiles.has(profileId)) {
      return true;
    }

    // If profile is currently loading, wait for it to complete
    if (this.loadingProfiles.has(profileId)) {
      return await this.loadingProfiles.get(profileId)!;
    }

    // Start loading the profile and track the promise
    const loadPromise = this._loadProfile(profileId);
    this.loadingProfiles.set(profileId, loadPromise);

    try {
      const result = await loadPromise;

      // Remove from loading map once complete
      if (result) {
        this.loadingProfiles.delete(profileId);
      }

      // Return result
      return result;
    } catch (error) {
      console.error(`Error loading profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Internal method to load a profile
   */
  private async _loadProfile(profileId: string): Promise<boolean> {
    try {
      const profileData = await getProfile(profileId);
      if (!profileData) {
        console.warn(`Profile data not found for ID: ${profileId}`);
        return false;
      }

      const profileSession = getSession(profileId);
      loadedProfileSessions.add(profileSession);

      const profilePath = getProfilePath(profileId);

      // Remove Electron and App details to closer emulate Chrome's UA
      const oldUserAgent = profileSession.getUserAgent();
      const newUserAgent = transformUserAgentHeader(oldUserAgent, null);

      if (oldUserAgent !== newUserAgent) {
        profileSession.setUserAgent(newUserAgent);
      }

      // Setup Extensions
      const tabManager = this.browser.tabs;

      const extensionsPath = path.join(profilePath, "Extensions");
      const crxExtensionsPath = path.join(extensionsPath, "crx");

      const extensions = new ElectronChromeExtensions({
        license: "GPL-3.0",
        session: profileSession,
        registerCrxProtocolInDefaultSession: false,
        assignTabDetails: (tabDetails, tabWebContents) => {
          const tab = tabManager.getTabByWebContents(tabWebContents);
          if (!tab) return;

          tabDetails.title = tab.title;
          tabDetails.url = tab.url;
          tabDetails.favIconUrl = tab.faviconURL ?? undefined;
          tabDetails.discarded = tab.asleep;
          tabDetails.autoDiscardable = false;
        },

        // Tabs
        createTab: async (tabDetails) => {
          const windowId = tabDetails.windowId;

          const window = windowId ? this.browser.getWindowById(windowId) : undefined;

          const tab = await tabManager.createTab(window?.id, profileId, undefined);
          if (tabDetails.url) {
            tab.loadURL(tabDetails.url);
          }
          if (tabDetails.active) {
            tabManager.setActiveTab(tab);
          }
          return [tab.webContents, tab.getWindow().window];
        },
        selectTab: (tabWebContents) => {
          const tab = tabManager.getTabByWebContents(tabWebContents);
          if (!tab) return;

          // Set the space for the window
          const window = tab.getWindow();
          setWindowSpace(window, tab.spaceId);

          // Set the active tab
          tabManager.setActiveTab(tab);
        },
        removeTab: (tabWebContents) => {
          const tab = tabManager.getTabByWebContents(tabWebContents);
          if (!tab) return;

          tab.destroy();
        },

        // Windows
        createWindow: async (details) => {
          const browser = this.browser;
          const tabManager = browser.tabs;

          const tabbedWindow = await browser.createWindow(details.type === "normal" ? "normal" : "popup", {
            window: {
              height: details.height,
              width: details.width,
              x: details.left,
              y: details.top
            }
          });

          const browserWindow = tabbedWindow.window;

          if (details.url) {
            const urls: string[] = Array.isArray(details.url) ? details.url : [details.url];

            let tabIndex = 0;
            for (const url of urls) {
              const currentTabIndex = tabIndex;

              tabManager.createTab(tabbedWindow.id, profileId).then((tab) => {
                tab.loadURL(url);
                if (currentTabIndex === 0) {
                  tabManager.setActiveTab(tab);
                }
              });

              tabIndex++;
            }
          }

          if (details.focused) {
            browserWindow.focus();
          }

          return browserWindow;
        },
        removeWindow: (window) => {
          const tabbedWindow = this.browser.getWindowById(window.id);
          if (!tabbedWindow) return;

          tabbedWindow.destroy();
        }
      });

      extensions.on("browser-action-popup-created", (popup: PopupView) => {
        if (popup.browserWindow) {
          registerWindow(
            WindowType.EXTENSION_POPUP,
            `${popup.extensionId}-${popup.browserWindow.id}`,
            popup.browserWindow
          );
        }
      });

      extensions.on("url-overrides-updated", (urlOverrides: { newtab?: string }) => {
        if (urlOverrides.newtab) {
          newProfile.newTabUrl = urlOverrides.newtab;
        }
      });

      // Load extensions
      const extensionsManager = new ExtensionManager(profileId, profileSession, extensionsPath);
      await extensionsManager.loadExtensions();

      // Install Chrome web store
      const minimumManifestVersion = getSettingValueById("enableMv2Extensions") ? 2 : undefined;
      await installChromeWebStore({
        session: profileSession,
        extensionsPath: crxExtensionsPath,
        minimumManifestVersion,
        loadExtensions: false,
        beforeInstall: async (details) => {
          if (!details.browserWindow || details.browserWindow.isDestroyed()) {
            return { action: "deny" };
          }

          const title = `Add “${details.localizedName}”?`;

          let message = `${title}`;
          if (details.manifest.permissions) {
            const permissions = (details.manifest.permissions || []).join(", ");
            message += `\n\nPermissions: ${permissions}`;
          }

          const returnValue = await dialog.showMessageBox(details.browserWindow, {
            title,
            message,
            icon: details.icon,
            buttons: ["Cancel", "Add Extension"]
          });

          return { action: returnValue.response === 0 ? "deny" : "allow" };
        },
        afterInstall: async (details) => {
          await extensionsManager.addInstalledExtension("crx", details.id);
        },
        afterUninstall: async (details) => {
          await extensionsManager.removeInstalledExtension(details.id);
        },
        customSetExtensionEnabled: async (_state, extensionId, enabled) => {
          await extensionsManager.setExtensionDisabled(extensionId, !enabled);
        },
        overrideExtensionInstallStatus: (_state, extensionId) => {
          const isDisabled = extensionsManager.getExtensionDisabled(extensionId);
          if (isDisabled) {
            return ExtensionInstallStatus.DISABLED;
          }
          // go to default implementation
          return undefined;
        }
      });

      // Create the loaded profile object
      const newProfile: LoadedProfile = {
        profileId,
        profileData,
        session: profileSession,
        extensions,
        extensionsManager,
        newTabUrl: NEW_TAB_URL,
        unload: () => this.handleProfileUnload(profileId)
      };

      this.profiles.set(profileId, newProfile);
      this.eventEmitter.emit("profile-loaded", profileId);
      return true;
    } catch (error) {
      console.error(`Error loading profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Handles profile unload
   */
  private handleProfileUnload(profileId: string): void {
    if (this.profiles.delete(profileId)) {
      this.eventEmitter.emit("profile-unloaded", profileId);

      // Destroy all tabs in the profile
      this.browser.tabs.getTabsInProfile(profileId).forEach((tab) => {
        tab.destroy();
      });
    }
  }

  /**
   * Unloads a profile by ID
   */
  public unloadProfile(profileId: string): boolean {
    try {
      const profile = this.profiles.get(profileId);
      if (!profile) {
        return false;
      }

      profile.unload();
      return true;
    } catch (error) {
      console.error(`Error unloading profile ${profileId}:`, error);
      return false;
    }
  }

  /**
   * Unloads all profiles
   */
  public unloadAll(): void {
    const profileIds = [...this.profiles.keys()];
    for (const profileId of profileIds) {
      try {
        this.unloadProfile(profileId);
      } catch (error) {
        console.error(`Error unloading profile ${profileId} during cleanup:`, error);
      }
    }
  }
}

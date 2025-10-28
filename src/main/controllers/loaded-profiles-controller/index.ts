import { getSession } from "@/browser/sessions";
import { transformUserAgentHeader } from "@/browser/utility/user-agent";
import { ProfileData, profilesController } from "@/controllers/profiles-controller";
import { NEW_TAB_URL, tabsController } from "@/controllers/tabs-controller";
import { windowsController } from "@/controllers/windows-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { setWindowSpace } from "@/ipc/session/spaces";
import { ExtensionManager } from "@/modules/extensions/management";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSettingValueById } from "@/saving/settings";
import { dialog, BrowserWindow as ElectronBrowserWindow, Session } from "electron";
import { ElectronChromeExtensions } from "electron-chrome-extensions";
import { ExtensionInstallStatus, installChromeWebStore } from "electron-chrome-web-store";
import path from "path";

type LoadedProfilesControllerEvents = {
  "profile-loaded": [profileId: string];
  "profile-unloaded": [profileId: string];
};

export type LoadedProfile = {
  readonly profileId: string;
  readonly profileData: ProfileData;
  readonly session: Session;
  readonly extensions: ElectronChromeExtensions;
  readonly extensionsManager: ExtensionManager;
  newTabUrl: string;
  unload: () => void;
};

interface BrowserActionPopupView {
  readonly POSITION_PADDING: number;
  readonly BOUNDS: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };

  browserWindow?: ElectronBrowserWindow;
  parent?: Electron.BaseWindow;
  extensionId: string;
}

class LoadedProfilesController extends TypedEventEmitter<LoadedProfilesControllerEvents> {
  private readonly loadedProfiles: Map<string, LoadedProfile>;
  private readonly loadingProfilePromises: Map<string, Promise<boolean>>;

  public readonly loadedProfileSessions: Set<Session>;

  constructor() {
    super();

    this.loadedProfiles = new Map();
    this.loadingProfilePromises = new Map();

    this.loadedProfileSessions = new Set();
  }

  // Getting Profiles //
  public get(profileId: string): LoadedProfile | undefined {
    return this.loadedProfiles.get(profileId);
  }

  public getAll(): LoadedProfile[] {
    return Array.from(this.loadedProfiles.values());
  }

  // Loading Profiles //
  public async load(profileId: string): Promise<boolean> {
    // If profile is already loaded, return immediately
    if (this.loadedProfiles.has(profileId)) {
      return true;
    }

    // If profile is currently loading, wait for it to complete
    if (this.loadingProfilePromises.has(profileId)) {
      return await this.loadingProfilePromises.get(profileId)!;
    }

    // Start loading the profile and track the promise
    const loadPromise = this._load(profileId);
    this.loadingProfilePromises.set(profileId, loadPromise);

    try {
      const result = await loadPromise;

      // Remove from loading map once complete
      if (result) {
        this.loadingProfilePromises.delete(profileId);
      }

      // Return result
      return result;
    } catch (error) {
      console.error(`Error loading profile ${profileId}:`, error);
      return false;
    }
  }

  private async _load(profileId: string): Promise<boolean> {
    const profileData = await profilesController.get(profileId);
    if (!profileData) {
      return false;
    }

    // Get the session for the profile
    const profileSession = getSession(profileId);
    this.loadedProfileSessions.add(profileSession);

    // Remove Electron and App details to closer emulate Chrome's User Agent
    const oldUserAgent = profileSession.getUserAgent();
    const newUserAgent = transformUserAgentHeader(oldUserAgent, null);
    if (oldUserAgent !== newUserAgent) {
      profileSession.setUserAgent(newUserAgent);
    }

    // Setup Extensions
    const profilePath = profilesController.getProfilePath(profileId);
    const extensionsPath = path.join(profilePath, "Extensions");
    const crxExtensionsPath = path.join(extensionsPath, "crx");

    const extensions = new ElectronChromeExtensions({
      license: "GPL-3.0",
      session: profileSession,
      registerCrxProtocolInDefaultSession: false,
      assignTabDetails: (tabDetails, tabWebContents) => {
        const tab = tabsController.getTabByWebContents(tabWebContents);
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
        const window = windowId ? browserWindowsController.getWindowById(windowId) : undefined;

        const tab = await tabsController.createTab(window?.id, profileId, undefined);
        if (tabDetails.url) {
          tab.loadURL(tabDetails.url);
        }
        if (tabDetails.active) {
          tabsController.setActiveTab(tab);
        }

        const electronWindow = tab.getWindow().browserWindow;
        return [tab.webContents, electronWindow];
      },
      selectTab: (tabWebContents) => {
        const tab = tabsController.getTabByWebContents(tabWebContents);
        if (!tab) return;

        // Set the space for the window
        const window = tab.getWindow();
        setWindowSpace(window, tab.spaceId);

        // Set the active tab
        tabsController.setActiveTab(tab);
      },
      removeTab: (tabWebContents) => {
        const tab = tabsController.getTabByWebContents(tabWebContents);
        if (!tab) return;

        tab.destroy();
      },

      // Windows
      createWindow: async (details) => {
        const window = await browserWindowsController.create(details.type === "normal" ? "normal" : "popup", {
          height: details.height,
          width: details.width,
          x: details.left,
          y: details.top
        });
        const browserWindow = window.browserWindow;

        if (details.url) {
          const urls: string[] = Array.isArray(details.url) ? details.url : [details.url];

          let tabIndex = 0;
          for (const url of urls) {
            const currentTabIndex = tabIndex;

            tabsController.createTab(window.id, profileId).then((tab) => {
              tab.loadURL(url);
              if (currentTabIndex === 0) {
                tabsController.setActiveTab(tab);
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
      removeWindow: (electronWindow) => {
        const window = browserWindowsController.getWindowById(electronWindow.id);
        if (!window) return;
        window.destroy();
      }
    });

    extensions.on("browser-action-popup-created", (popup: BrowserActionPopupView) => {
      if (popup.browserWindow) {
        windowsController.extensionPopup.new(popup.browserWindow);
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
      unload: () => this._handleProfileUnload(profileId)
    };

    this.loadedProfiles.set(profileId, newProfile);
    this.emit("profile-loaded", profileId);

    return true;
  }

  // Unloading Profiles //
  private _handleProfileUnload(profileId: string): void {
    const success = this.loadedProfiles.delete(profileId);
    if (!success) return;

    this.emit("profile-unloaded", profileId);

    // Destroy all tabs in the profile
    tabsController.getTabsInProfile(profileId).forEach((tab) => {
      tab.destroy();
    });
  }

  /**
   * Unloads a profile by ID
   */
  public unload(profileId: string): boolean {
    try {
      const loadedProfile = this.loadedProfiles.get(profileId);
      if (!loadedProfile) {
        return false;
      }
      loadedProfile.unload();
      return true;
    } catch (error) {
      console.error(`Error unloading profile ${profileId}:`, error);
      return false;
    }
  }
}

export const loadedProfilesController = new LoadedProfilesController();

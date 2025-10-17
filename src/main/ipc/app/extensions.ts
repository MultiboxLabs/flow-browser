import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { transformStringToLocale } from "@/modules/extensions/locales";
import {
  ExtensionData,
  ExtensionManager,
  getExtensionIcon,
  getExtensionSize,
  getManifest
} from "@/modules/extensions/management";
import { getPermissionWarnings } from "@/modules/extensions/permission-warnings";
import { spacesController } from "@/controllers/spaces-controller";
import { dialog, ipcMain, IpcMainInvokeEvent, WebContents } from "electron";
import { SharedExtensionData } from "~/types/extensions";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";

function translateManifestString(extensionPath: string, str: string) {
  const re = /^__MSG_(.+?)__$/;
  const match = str.match(re);
  if (!match) return str;

  const [, key] = match;
  return transformStringToLocale(extensionPath, key);
}

async function generateSharedExtensionData(
  extensionsManager: ExtensionManager,
  extensionId: string,
  extensionData: ExtensionData
): Promise<SharedExtensionData | null> {
  const extensionPath = await extensionsManager.getExtensionPath(extensionId, extensionData);
  if (!extensionPath) return null;

  const manifest = await getManifest(extensionPath);
  if (!manifest) return null;

  const size = await getExtensionSize(extensionPath);
  if (!size) return null;

  const permissions: string[] = getPermissionWarnings(manifest.permissions ?? [], manifest.host_permissions ?? []);

  const translatedName = await translateManifestString(extensionPath, manifest.name);
  const translatedShortName = manifest.short_name
    ? await translateManifestString(extensionPath, manifest.short_name)
    : undefined;
  const translatedDescription = manifest.description
    ? await translateManifestString(extensionPath, manifest.description)
    : undefined;

  const iconURL = new URL("flow://extension-icon");
  iconURL.searchParams.set("id", extensionId);
  iconURL.searchParams.set("profile", extensionsManager.profileId);

  return {
    type: extensionData.type,
    id: extensionId,
    name: translatedName,
    short_name: translatedShortName,
    description: translatedDescription,
    icon: iconURL.toString(),
    enabled: extensionData.disabled ? false : true,
    pinned: extensionData.pinned ? true : false,
    version: manifest.version,
    path: extensionPath,
    size,
    permissions,
    // TODO: Add inspect views
    inspectViews: []
  };
}

async function getExtensionDataFromProfile(profileId: string): Promise<SharedExtensionData[]> {
  const loadedProfile = loadedProfilesController.get(profileId);
  if (!loadedProfile) {
    return [];
  }

  const { extensionsManager } = loadedProfile;

  const extensions = await extensionsManager.getInstalledExtensions();
  const promises = extensions.map(async (extensionData) => {
    return generateSharedExtensionData(extensionsManager, extensionData.id, extensionData);
  });

  const results = await Promise.all(promises);
  return results.filter((result) => result !== null);
}

async function getCurrentProfileIdFromWebContents(webContents: WebContents): Promise<string | null> {
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return null;

  const spaceId = window.currentSpaceId;
  if (!spaceId) return null;

  const space = await spacesController.get(spaceId);
  if (!space) return null;

  return space.profileId;
}

ipcMain.handle(
  "extensions:get-all-in-current-profile",
  async (event: IpcMainInvokeEvent): Promise<SharedExtensionData[]> => {
    const profileId = await getCurrentProfileIdFromWebContents(event.sender);
    if (!profileId) return [];

    return getExtensionDataFromProfile(profileId);
  }
);

ipcMain.handle(
  "extensions:set-extension-enabled",
  async (event: IpcMainInvokeEvent, extensionId: string, enabled: boolean): Promise<boolean> => {
    const profileId = await getCurrentProfileIdFromWebContents(event.sender);
    if (!profileId) return false;

    const loadedProfile = loadedProfilesController.get(profileId);
    if (!loadedProfile) return false;

    const { extensionsManager } = loadedProfile;
    if (!extensionsManager) return false;

    return await extensionsManager.setExtensionDisabled(extensionId, !enabled);
  }
);

ipcMain.handle(
  "extensions:uninstall-extension",
  async (event: IpcMainInvokeEvent, extensionId: string): Promise<boolean> => {
    const profileId = await getCurrentProfileIdFromWebContents(event.sender);
    if (!profileId) return false;

    const loadedProfile = loadedProfilesController.get(profileId);
    if (!loadedProfile) return false;

    const { extensionsManager } = loadedProfile;
    if (!extensionsManager) return false;

    const window = browserWindowsController.getWindowFromWebContents(event.sender);
    if (!window) return false;

    const extensionData = extensionsManager.getExtensionDataFromCache(extensionId);
    if (!extensionData) return false;

    const sharedExtensionData = await generateSharedExtensionData(extensionsManager, extensionId, extensionData);

    if (!sharedExtensionData) return false;

    const extensionIcon = await getExtensionIcon(sharedExtensionData.path);

    const returnValue = await dialog.showMessageBox(window.browserWindow, {
      icon: extensionIcon ?? undefined,
      title: "Uninstall Extension",
      message: `Are you sure you want to uninstall "${sharedExtensionData.name}"?`,
      buttons: ["Cancel", "Uninstall"]
    });

    if (returnValue.response === 0) {
      return false;
    }

    return await extensionsManager.uninstallExtension(extensionId);
  }
);

ipcMain.handle(
  "extensions:set-extension-pinned",
  async (event: IpcMainInvokeEvent, extensionId: string, pinned: boolean): Promise<boolean> => {
    const profileId = await getCurrentProfileIdFromWebContents(event.sender);
    if (!profileId) return false;

    const loadedProfile = loadedProfilesController.get(profileId);
    if (!loadedProfile) return false;

    const { extensionsManager } = loadedProfile;
    if (!extensionsManager) return false;

    return await extensionsManager.setPinned(extensionId, pinned);
  }
);

export async function fireOnExtensionsUpdated(profileId: string) {
  const extensions = await getExtensionDataFromProfile(profileId);
  sendMessageToListeners("extensions:on-updated", profileId, extensions);
}

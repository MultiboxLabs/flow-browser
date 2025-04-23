import { browser } from "@/index";
import { transformStringToLocale } from "@/modules/extensions/locales";
import { ExtensionData, ExtensionManager, getExtensionSize, getManifest } from "@/modules/extensions/management";
import { getPermissionWarnings } from "@/modules/extensions/permission-warnings";
import { getSpace } from "@/sessions/spaces";
import { ipcMain, IpcMainInvokeEvent } from "electron";
import { SharedExtensionData } from "~/types/extensions";

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
    description: translatedDescription,
    icon: iconURL.toString(),
    enabled: !extensionData.disabled,
    version: manifest.version,
    path: extensionPath,
    size,
    permissions,
    inspectViews: []
  };
}

async function getExtensionDataFromProfile(profileId: string): Promise<SharedExtensionData[]> {
  if (!browser) return [];

  const loadedProfile = browser.getLoadedProfile(profileId);
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

ipcMain.handle(
  "extensions:get-all-in-current-profile",
  async (event: IpcMainInvokeEvent): Promise<SharedExtensionData[]> => {
    if (!browser) return [];

    const window = browser.getWindowFromWebContents(event.sender);
    if (!window) return [];

    const spaceId = window.getCurrentSpace();
    if (!spaceId) return [];

    const space = await getSpace(spaceId);
    if (!space) return [];

    return getExtensionDataFromProfile(space.profileId);
  }
);

export async function fireOnExtensionsUpdated(profileId: string) {
  if (!browser) return;

  const extensions = await getExtensionDataFromProfile(profileId);
  for (const tab of browser?.tabs.getTabsInProfile(profileId)) {
    if (tab.profileId === profileId) {
      tab.webContents.send("extensions:on-updated", extensions);
    }
  }
}

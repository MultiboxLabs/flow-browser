import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { setWindowSpace } from "@/ipc/session/spaces";
import { createIncognitoProfileId, isIncognitoProfileId } from "@/modules/incognito";

const incognitoWindowToProfileId = new Map<number, string>();

export async function createIncognitoWindow() {
  const profileId = createIncognitoProfileId();
  const profileName = "Incognito";

  const createdProfile = await profilesController.createWithId(profileId, profileName, true);
  if (!createdProfile) {
    throw new Error("Failed to create incognito profile");
  }

  const loaded = await loadedProfilesController.load(profileId);
  if (!loaded) {
    await profilesController.delete(profileId);
    throw new Error("Failed to load incognito profile");
  }

  const window = await browserWindowsController.create();
  incognitoWindowToProfileId.set(window.id, profileId);

  window.on("destroyed", () => {
    cleanupIncognitoWindow(window.id).catch((error) => {
      console.error("Failed to cleanup incognito window:", error);
    });
  });

  try {
    const space = await spacesController.getLastUsedFromProfile(profileId);
    if (!space) {
      throw new Error("Failed to create incognito space");
    }

    setWindowSpace(window, space.id);

    const tab = await tabsController.createTab(window.id, profileId, space.id);
    tabsController.setActiveTab(tab);

    return window;
  } catch (error) {
    await cleanupIncognitoWindow(window.id);
    throw error;
  }
}

export function isIncognitoTabProfile(profileId: string): boolean {
  return isIncognitoProfileId(profileId);
}

export async function cleanupLiveIncognitoProfiles() {
  const profileIds = new Set(incognitoWindowToProfileId.values());
  const cleanupPromises = Array.from(profileIds).map((profileId) => cleanupIncognitoProfile(profileId));

  await Promise.all(cleanupPromises);
  incognitoWindowToProfileId.clear();
}

/**
 * Removes stale incognito profiles from disk (e.g. app crash, force quit).
 * Should run once during startup before windows are created.
 */
export async function cleanupStaleIncognitoProfiles() {
  const profiles = await profilesController.getAll();
  const staleIncognitoProfileIds = profiles
    .filter((profile) => isIncognitoProfileId(profile.id))
    .map((profile) => profile.id);

  const cleanupPromises = staleIncognitoProfileIds.map((profileId) => cleanupIncognitoProfile(profileId));
  await Promise.all(cleanupPromises);
}

async function cleanupIncognitoWindow(windowId: number) {
  const profileId = incognitoWindowToProfileId.get(windowId);
  if (!profileId) return;

  incognitoWindowToProfileId.delete(windowId);
  await cleanupIncognitoProfile(profileId);
}

async function cleanupIncognitoProfile(profileId: string) {
  loadedProfilesController.unload(profileId);
  await profilesController.delete(profileId);
}

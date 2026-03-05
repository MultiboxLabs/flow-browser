import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { setWindowSpace } from "@/ipc/session/spaces";
import { createIncognitoProfileId, isIncognitoProfileId } from "@/modules/incognito";

const incognitoWindowToProfileId = new Map<number, string>();

export async function createIncognitoWindow() {
  const profileId = createIncognitoProfileId();
  const profileName = "Incognito";

  // Create profile without auto-creating a space so we can create the space
  // with hidden/ephemeral/locked flags already set (avoids a brief flicker
  // where the space would be visible in the switcher before being updated).
  const createdProfile = await profilesController.createWithId(profileId, profileName, false);
  if (!createdProfile) {
    throw new Error("Failed to create incognito profile");
  }

  // Create the incognito space with all flags from the start
  const spaceCreated = await spacesController.create(profileId, profileName, {
    hidden: true,
    ephemeral: true,
    locked: true,
    bgStartColor: "#000000",
    bgEndColor: "#000000"
  });
  if (!spaceCreated) {
    await profilesController.delete(profileId);
    throw new Error("Failed to create incognito space");
  }

  const loaded = await loadedProfilesController.load(profileId);
  if (!loaded) {
    await profilesController.delete(profileId);
    throw new Error("Failed to load incognito profile");
  }

  const window = await browserWindowsController.create();
  window.browserWindow.maximize();
  incognitoWindowToProfileId.set(window.id, profileId);

  window.on("destroyed", () => {
    cleanupIncognitoWindow(window.id).catch((error) => {
      console.error("Failed to cleanup incognito window:", error);
    });
  });

  try {
    const space = await spacesController.getLastUsedFromProfile(profileId);
    if (!space) {
      throw new Error("Failed to get incognito space");
    }

    setWindowSpace(window, space.id);

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
 * Removes stale ephemeral profiles from disk (e.g. app crash, force quit).
 * A profile is considered ephemeral if any of its spaces has ephemeral: true.
 * Should run once during startup before windows are created.
 */
export async function cleanupStaleEphemeralProfiles() {
  const profiles = await profilesController.getAll();
  const staleProfileIds: string[] = [];

  for (const profile of profiles) {
    const spaces = await spacesController.getAllFromProfile(profile.id);
    if (spaces.some((s) => s.ephemeral)) {
      staleProfileIds.push(profile.id);
    }
  }

  const cleanupPromises = staleProfileIds.map((profileId) => cleanupIncognitoProfile(profileId));
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

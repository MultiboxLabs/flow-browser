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

  const space = await spacesController.getLastUsedFromProfile(profileId);
  if (!space) {
    throw new Error("Failed to create incognito space");
  }

  setWindowSpace(window, space.id);

  const tab = await tabsController.createTab(window.id, profileId, space.id);
  tabsController.setActiveTab(tab);

  return window;
}

export function isIncognitoTabProfile(profileId: string): boolean {
  return isIncognitoProfileId(profileId);
}

async function cleanupIncognitoWindow(windowId: number) {
  const profileId = incognitoWindowToProfileId.get(windowId);
  if (!profileId) return;

  incognitoWindowToProfileId.delete(windowId);
  loadedProfilesController.unload(profileId);
  await profilesController.delete(profileId);
}

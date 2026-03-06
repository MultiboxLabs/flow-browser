import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { setWindowSpace } from "@/ipc/session/spaces";
import { createIncognitoProfileId, isIncognitoProfileId } from "@/modules/incognito";

// ---------------------------------------------------------------------------
// Shared incognito session
// ---------------------------------------------------------------------------
// All incognito windows share a single profile & space. The session is created
// when the first incognito window opens and torn down when the last one closes.
// The next window after that gets a brand-new session.

interface IncognitoSession {
  profileId: string;
  spaceId: string;
  /** Window IDs currently using this session. */
  windowIds: Set<number>;
}

let activeSession: IncognitoSession | null = null;

/**
 * Returns the existing shared session, or creates a new one if none exists.
 */
async function getOrCreateSession(): Promise<IncognitoSession> {
  if (activeSession) return activeSession;

  const profileId = createIncognitoProfileId();
  const profileName = "Incognito";

  // Create profile with internal + ephemeral flags, without auto-creating a
  // space so we can set custom background colors on the space directly.
  const createdProfile = await profilesController.createWithId(profileId, profileName, false, {
    internal: true,
    ephemeral: true
  });
  if (!createdProfile) {
    throw new Error("Failed to create incognito profile");
  }

  // Create the incognito space with custom background colors
  const spaceCreated = await spacesController.create(profileId, profileName, {
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

  const space = await spacesController.getLastUsedFromProfile(profileId);
  if (!space) {
    await profilesController.delete(profileId);
    throw new Error("Failed to get incognito space");
  }

  activeSession = { profileId, spaceId: space.id, windowIds: new Set() };
  return activeSession;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createIncognitoWindow() {
  const session = await getOrCreateSession();

  const window = await browserWindowsController.create();
  window.browserWindow.maximize();
  session.windowIds.add(window.id);

  window.on("destroyed", () => {
    removeWindowFromSession(window.id).catch((error) => {
      console.error("Failed to cleanup incognito window:", error);
    });
  });

  try {
    setWindowSpace(window, session.spaceId);
    return window;
  } catch (error) {
    await removeWindowFromSession(window.id);
    throw error;
  }
}

export function isIncognitoTabProfile(profileId: string): boolean {
  return isIncognitoProfileId(profileId);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Removes a window from the active session. If it was the last window,
 * tears down the entire session (profile + space deleted).
 */
async function removeWindowFromSession(windowId: number) {
  if (!activeSession) return;

  activeSession.windowIds.delete(windowId);

  if (activeSession.windowIds.size === 0) {
    const { profileId } = activeSession;
    activeSession = null;
    await profilesController.delete(profileId);
  }
}

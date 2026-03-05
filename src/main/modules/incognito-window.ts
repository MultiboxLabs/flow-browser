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

  const space = await spacesController.getLastUsedFromProfile(profileId);
  if (!space) {
    loadedProfilesController.unload(profileId);
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

/**
 * Tears down the active session (all live incognito windows).
 * Called during app quit.
 */
export async function cleanupLiveIncognitoProfiles() {
  if (!activeSession) return;
  const { profileId } = activeSession;
  activeSession = null;
  await destroyIncognitoProfile(profileId);
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

  const cleanupPromises = staleProfileIds.map((profileId) => destroyIncognitoProfile(profileId));
  await Promise.all(cleanupPromises);
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
    await destroyIncognitoProfile(profileId);
  }
}

async function destroyIncognitoProfile(profileId: string) {
  loadedProfilesController.unload(profileId);
  await profilesController.delete(profileId);
}

import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { profilesController } from "@/controllers/profiles-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { setWindowSpace } from "@/ipc/session/spaces";

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
  /** Window creations currently using this session. */
  pendingWindowCreations: number;
}

let activeSession: IncognitoSession | null = null;
let sessionCreationPromise: Promise<IncognitoSession> | null = null;

/**
 * Returns the existing shared session, or creates a new one if none exists.
 * Guarded against concurrent calls — if a creation is already in-flight,
 * subsequent callers will wait for the same promise.
 */
async function getOrCreateSession(): Promise<IncognitoSession> {
  if (activeSession) return activeSession;
  if (sessionCreationPromise) return sessionCreationPromise;

  sessionCreationPromise = (async () => {
    const incognito = await profilesController.createIncognito();
    if (!incognito) {
      throw new Error("Failed to create incognito profile");
    }

    const { profileId, spaceId } = incognito;

    const loaded = await loadedProfilesController.load(profileId);
    if (!loaded) {
      await profilesController.delete(profileId);
      throw new Error("Failed to load incognito profile");
    }

    activeSession = {
      profileId,
      spaceId,
      windowIds: new Set(),
      pendingWindowCreations: 0
    };
    return activeSession;
  })().finally(() => {
    sessionCreationPromise = null;
  });

  return sessionCreationPromise;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function createIncognitoWindow() {
  const session = await getOrCreateSession();
  session.pendingWindowCreations += 1;

  const window = await browserWindowsController.create();
  window.browserWindow.maximize();
  session.pendingWindowCreations -= 1;
  session.windowIds.add(window.id);

  window.on("destroyed", () => {
    removeWindowFromSession(window.id).catch((error) => {
      console.error("Failed to cleanup incognito window:", error);
    });
  });

  try {
    await setWindowSpace(window, session.spaceId);
    return window;
  } catch (error) {
    await removeWindowFromSession(window.id);
    window.destroy(true);
    throw error;
  }
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

  const session = activeSession;
  session.windowIds.delete(windowId);

  await maybeDisposeSession(session);
}

async function maybeDisposeSession(session: IncognitoSession) {
  if (activeSession === session && session.windowIds.size === 0 && session.pendingWindowCreations === 0) {
    const { profileId } = session;
    activeSession = null;
    await profilesController.delete(profileId);
  }
}

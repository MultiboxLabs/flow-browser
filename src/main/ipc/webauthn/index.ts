import { getWebauthnAddon } from "@/ipc/webauthn/module";
import { isPublicSuffix } from "@/ipc/webauthn/psl-check";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { getSettingValueById } from "@/saving/settings";
import { BrowserWindow, ipcMain } from "electron";
import type { WebContents } from "electron";
import type {
  AssertCredentialErrorCodes,
  AssertCredentialResult,
  CreateCredentialErrorCodes,
  CreateCredentialResult
} from "~/types/fido2-types";
import type { PasskeyCredentialInfo } from "~/flow/interfaces/browser/passkey-overlay";

/**
 * Convert a BufferSource (ArrayBuffer | ArrayBufferView) to a Node/Bun Buffer.
 * Zero-copy when possible (shares memory with the underlying ArrayBuffer).
 */
export function bufferSourceToBuffer(src: BufferSource): Buffer {
  if (Buffer.isBuffer(src)) return src;

  // ArrayBuffer / SharedArrayBuffer
  if (src instanceof ArrayBuffer || (typeof SharedArrayBuffer !== "undefined" && src instanceof SharedArrayBuffer)) {
    return Buffer.from(src);
  }

  // ArrayBufferView: Uint8Array, DataView, etc.
  // (DataView is also an ArrayBufferView)
  if (ArrayBuffer.isView(src)) {
    return Buffer.from(src.buffer, src.byteOffset, src.byteLength);
  }

  throw new TypeError("Expected BufferSource (ArrayBuffer or ArrayBufferView)");
}

// ─── Conditional Mediation Session Tracking ──────────────────────────────────

interface ConditionalSession {
  resolve: (value: AssertCredentialResult | AssertCredentialErrorCodes | null) => void;
  publicKeyOptions: PublicKeyCredentialRequestOptions | undefined;
  passkeys: PasskeyCredentialInfo[];
  currentOrigin: string;
  topFrameOrigin: string | undefined;
  tabWebContents: WebContents;
  selectedIndex: number; // -1 = no selection
  overlayVisible: boolean;
}

const conditionalSessions = new Map<number, ConditionalSession>();

function cancelConditionalSession(tabWcId: number, reason: AssertCredentialErrorCodes = "AbortError") {
  const session = conditionalSessions.get(tabWcId);
  if (session) {
    session.resolve(reason);
    conditionalSessions.delete(tabWcId);
  }
}

/** Send the current selectedIndex to the browser chrome renderer for display. */
function sendSelectionUpdate(session: ConditionalSession) {
  const tab = tabsController.getTabByWebContents(session.tabWebContents);
  if (!tab) return;
  try {
    tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-update-selection", session.selectedIndex);
  } catch {
    // Window may already be destroyed
  }
}

/**
 * Handle keyboard input from the tab's webContents when a conditional session
 * is active and the overlay is visible. Uses `before-input-event` so we can
 * synchronously prevent default behavior (critical for Enter).
 */
function handleBeforeInput(tabWcId: number, event: Electron.Event, input: Electron.Input) {
  if (input.type !== "keyDown") return;

  const session = conditionalSessions.get(tabWcId);
  if (!session || !session.overlayVisible) return;

  switch (input.key) {
    case "ArrowDown":
      event.preventDefault();
      session.selectedIndex = Math.min(session.selectedIndex + 1, session.passkeys.length - 1);
      sendSelectionUpdate(session);
      break;
    case "ArrowUp":
      event.preventDefault();
      if (session.selectedIndex > 0) {
        session.selectedIndex = session.selectedIndex - 1;
      }
      sendSelectionUpdate(session);
      break;
    case "Enter":
      if (session.selectedIndex >= 0 && session.passkeys[session.selectedIndex]) {
        event.preventDefault();
        const tab = tabsController.getTabByWebContents(session.tabWebContents);
        if (tab) {
          const passkey = session.passkeys[session.selectedIndex];
          try {
            tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
          } catch {
            // Window may already be destroyed
          }
          session.overlayVisible = false;
          performConditionalSelect(tabWcId, session, passkey.id);
        }
      }
      // If nothing selected, let Enter pass through to the page
      break;
    case "Escape":
      event.preventDefault();
      session.overlayVisible = false;
      session.selectedIndex = -1;
      {
        const tab = tabsController.getTabByWebContents(session.tabWebContents);
        if (tab) {
          try {
            tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
          } catch {
            // Window may already be destroyed
          }
        }
      }
      break;
  }
}

/**
 * Perform the actual credential selection for a conditional session.
 * Shared by both the keyboard Enter handler and the click-based select IPC.
 */
async function performConditionalSelect(tabWcId: number, session: ConditionalSession, credentialId: string) {
  // Validate that the credential ID was in the set presented to the user
  const isKnownCredential = session.passkeys.some((p) => p.id === credentialId);
  if (!isKnownCredential) {
    session.resolve("NotAllowedError");
    conditionalSessions.delete(tabWcId);
    return;
  }

  const webauthn = await getWebauthnAddon();
  if (!webauthn) {
    session.resolve("NotSupportedError");
    conditionalSessions.delete(tabWcId);
    return;
  }

  const tab = tabsController.getTabByWebContents(session.tabWebContents);
  const win = tab ? BrowserWindow.fromId(tab.getWindow().browserWindow.id) : null;
  if (!win) {
    session.resolve("NotAllowedError");
    conditionalSessions.delete(tabWcId);
    return;
  }

  const conditionalOptions = {
    ...session.publicKeyOptions,
    allowCredentials: [
      {
        type: "public-key" as const,
        id: Buffer.from(credentialId, "base64url")
      }
    ]
  } as PublicKeyCredentialRequestOptions;

  const result = await webauthn.getCredential(conditionalOptions, {
    currentOrigin: session.currentOrigin,
    topFrameOrigin: session.topFrameOrigin,
    isPublicSuffix,
    nativeWindowHandle: win.getNativeWindowHandle()
  });

  // Guard against stale session reference after async gap
  if (conditionalSessions.get(tabWcId) !== session) {
    return;
  }

  if (result.success === false) {
    session.resolve(result.error);
  } else {
    session.resolve(result.data);
  }

  conditionalSessions.delete(tabWcId);
}

// ─── webauthn:create ─────────────────────────────────────────────────────────

ipcMain.handle(
  "webauthn:create",
  async (
    event,
    options: CredentialCreationOptions | undefined
  ): Promise<CreateCredentialResult | CreateCredentialErrorCodes | null> => {
    const webauthn = await getWebauthnAddon();
    if (!webauthn) {
      return "NotSupportedError";
    }

    if (!options) {
      return null;
    }

    const publicKeyOptions = options.publicKey;

    const senderFrame = event.senderFrame;
    if (!senderFrame) {
      return null;
    }

    const topFrame = senderFrame.top;
    if (!topFrame) {
      // Some weird case where the top frame is not available, its unsafe to continue
      return null;
    }

    const currentOrigin = senderFrame.origin;
    if (!currentOrigin) {
      return null;
    }

    const isMainFrame = topFrame === senderFrame;
    let topFrameOrigin: string | undefined;
    if (!isMainFrame) {
      topFrameOrigin = topFrame.origin;
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return null;
    }

    const result = await webauthn.createCredential(publicKeyOptions, {
      currentOrigin,
      topFrameOrigin,
      isPublicSuffix,
      nativeWindowHandle: win.getNativeWindowHandle()
    });

    if (result.success === false) {
      return result.error;
    }

    return result.data;
  }
);

// ─── webauthn:get (with conditional mediation support) ───────────────────────

ipcMain.handle(
  "webauthn:get",
  async (
    event,
    options: CredentialRequestOptions | undefined
  ): Promise<AssertCredentialResult | AssertCredentialErrorCodes | null> => {
    const webauthn = await getWebauthnAddon();
    if (!webauthn) {
      return "NotSupportedError";
    }

    if (!options) {
      return null;
    }

    const publicKeyOptions = options.publicKey;

    const senderFrame = event.senderFrame;
    if (!senderFrame) {
      return null;
    }

    const topFrame = senderFrame.top;
    if (!topFrame) {
      return null;
    }

    const currentOrigin = senderFrame.origin;
    if (!currentOrigin) {
      return null;
    }

    const isMainFrame = topFrame === senderFrame;
    let topFrameOrigin: string | undefined;
    if (!isMainFrame) {
      topFrameOrigin = topFrame.origin;
    }

    // ── Conditional mediation ──

    if (options.mediation === "conditional") {
      if (getSettingValueById("enablePasskeyAutofill") === false) {
        return "NotAllowedError";
      }

      if (!publicKeyOptions) {
        return null;
      }

      const rpId = publicKeyOptions.rpId || new URL(currentOrigin).hostname;
      const listResult = await webauthn.listPasskeys(rpId);

      if (!listResult.success || listResult.credentials.length === 0) {
        return "NotAllowedError";
      }

      // Cancel any existing conditional session for this tab
      cancelConditionalSession(event.sender.id);

      // Send passkey list to tab preload for DOM observer setup
      event.sender.send("webauthn:conditional-passkeys", listResult.credentials);

      const tabWcId = event.sender.id;

      // Cleanup handlers for tab destruction and navigation
      const cleanup = () => {
        cancelConditionalSession(tabWcId, "AbortError");
        // Hide overlay if the tab's window still exists
        const tab = tabsController.getTabByWebContents(event.sender);
        if (tab) {
          try {
            tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
          } catch {
            // Window may already be destroyed
          }
        }
      };

      event.sender.once("destroyed", cleanup);
      event.sender.once("did-start-navigation", cleanup);

      // Hide overlay immediately when the user switches tabs
      const disconnectActiveTabChanged = tabsController.connect("active-tab-changed", (windowId) => {
        const tab = tabsController.getTabByWebContents(event.sender);
        if (!tab) return;
        if (tab.getWindow().id !== windowId) return;

        // Check if this tab is still the active one
        if (!tabsController.isTabActive(tab)) {
          // Tab is no longer active — hide overlay but keep session alive
          const session = conditionalSessions.get(tabWcId);
          if (session) {
            session.overlayVisible = false;
            session.selectedIndex = -1;
          }
          try {
            tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
          } catch {
            // Window may already be destroyed
          }
        }
      });

      // Intercept keyboard events (arrows, enter, escape) from the tab's
      // webContents so we can navigate the overlay without stealing focus.
      const beforeInputHandler = (_event: Electron.Event, input: Electron.Input) => {
        handleBeforeInput(tabWcId, _event, input);
      };
      event.sender.on("before-input-event", beforeInputHandler);

      return new Promise<AssertCredentialResult | AssertCredentialErrorCodes | null>((resolve) => {
        conditionalSessions.set(tabWcId, {
          resolve: (value) => {
            // Remove cleanup listeners once resolved
            event.sender.removeListener("destroyed", cleanup);
            event.sender.removeListener("did-start-navigation", cleanup);
            event.sender.removeListener("before-input-event", beforeInputHandler);
            disconnectActiveTabChanged();
            resolve(value);
          },
          publicKeyOptions,
          passkeys: listResult.credentials,
          currentOrigin,
          topFrameOrigin,
          tabWebContents: event.sender,
          selectedIndex: -1,
          overlayVisible: false
        });
      });
    }

    // ── Standard (non-conditional) flow ──

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return null;
    }

    const result = await webauthn.getCredential(publicKeyOptions, {
      currentOrigin,
      topFrameOrigin,
      isPublicSuffix,
      nativeWindowHandle: win.getNativeWindowHandle()
    });

    if (result.success === false) {
      return result.error;
    }

    return result.data;
  }
);

// ─── Conditional UI: input focus/blur from tab preload ───────────────────────

ipcMain.on(
  "webauthn:conditional-input-focus",
  (event, rect: { x: number; y: number; width: number; height: number }) => {
    const session = conditionalSessions.get(event.sender.id);
    if (!session) return;

    const tab = tabsController.getTabByWebContents(event.sender);
    if (!tab) return;

    const managers = tabsController.getTabManagers(tab.id);
    if (!managers) return;

    const tabBounds = managers.bounds.bounds;
    if (!tabBounds) return;

    const browserWindow = tab.getWindow();

    const OVERLAY_MIN_WIDTH = 300;
    const PASSKEY_ITEM_HEIGHT = 48;
    const OVERLAY_HEADER_HEIGHT = 40;
    const OVERLAY_MAX_HEIGHT = 300;

    const position = {
      x: tabBounds.x + rect.x,
      y: tabBounds.y + rect.y + rect.height,
      width: Math.max(rect.width, OVERLAY_MIN_WIDTH),
      height: Math.min(session.passkeys.length * PASSKEY_ITEM_HEIGHT + OVERLAY_HEADER_HEIGHT, OVERLAY_MAX_HEIGHT)
    };

    session.overlayVisible = true;
    session.selectedIndex = -1;

    browserWindow.sendMessageToCoreWebContents("webauthn:conditional-show-overlay", {
      passkeys: session.passkeys,
      position
    });
  }
);

ipcMain.on("webauthn:conditional-input-blur", (event) => {
  const session = conditionalSessions.get(event.sender.id);
  if (session) {
    session.overlayVisible = false;
    session.selectedIndex = -1;
  }

  const tab = tabsController.getTabByWebContents(event.sender);
  if (!tab) return;

  const browserWindow = tab.getWindow();
  browserWindow.sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
});

// ─── Conditional UI: select/dismiss from browser chrome ──────────────────────

ipcMain.on("webauthn:conditional-select", async (event, credentialId: string) => {
  const browserWindow = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!browserWindow) return;

  const spaceId = browserWindow.currentSpaceId;
  if (!spaceId) return;

  const focusedTab = tabsController.getFocusedTab(browserWindow.id, spaceId);
  if (!focusedTab?.webContents) return;

  const tabWcId = focusedTab.webContents.id;
  const session = conditionalSessions.get(tabWcId);
  if (!session) return;

  // Hide the overlay immediately
  browserWindow.sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
  session.overlayVisible = false;

  performConditionalSelect(tabWcId, session, credentialId);
});

ipcMain.on("webauthn:conditional-set-selection", (event, index: number) => {
  const browserWindow = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!browserWindow) return;

  const spaceId = browserWindow.currentSpaceId;
  if (!spaceId) return;

  const focusedTab = tabsController.getFocusedTab(browserWindow.id, spaceId);
  if (!focusedTab?.webContents) return;

  const session = conditionalSessions.get(focusedTab.webContents.id);
  if (!session) return;

  session.selectedIndex = index;
});

ipcMain.on("webauthn:conditional-dismiss", (event) => {
  const browserWindow = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!browserWindow) return;

  const spaceId = browserWindow.currentSpaceId;
  if (!spaceId) return;

  const focusedTab = tabsController.getFocusedTab(browserWindow.id, spaceId);
  if (!focusedTab?.webContents) return;

  cancelConditionalSession(focusedTab.webContents.id, "NotAllowedError");
  browserWindow.sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
});

// ─── Availability checks ─────────────────────────────────────────────────────

ipcMain.handle("webauthn:is-available", async (): Promise<boolean> => {
  const webauthn = await getWebauthnAddon();
  return webauthn !== null;
});

// Platform-version check (e.g. macOS 13.3+) is deferred to listPasskeys() at
// runtime; we only gate on addon availability and the user setting here.
ipcMain.handle("webauthn:is-conditional-available", async (): Promise<boolean> => {
  if (getSettingValueById("enablePasskeyAutofill") === false) {
    return false;
  }
  const webauthn = await getWebauthnAddon();
  return webauthn !== null;
});

import { getWebauthnAddon } from "@/ipc/webauthn/module";
import { isPublicSuffix } from "@/ipc/webauthn/psl-check";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { getSettingValueById } from "@/saving/settings";
import { BrowserWindow, ipcMain } from "electron";
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
}

const conditionalSessions = new Map<number, ConditionalSession>();

function cancelConditionalSession(tabWcId: number, reason: AssertCredentialErrorCodes = "AbortError") {
  const session = conditionalSessions.get(tabWcId);
  if (session) {
    session.resolve(reason);
    conditionalSessions.delete(tabWcId);
  }
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
      event.sender.once("did-navigate", cleanup);

      // Hide overlay immediately when the user switches tabs
      const disconnectActiveTabChanged = tabsController.connect("active-tab-changed", (windowId) => {
        const tab = tabsController.getTabByWebContents(event.sender);
        if (!tab) return;
        if (tab.getWindow().id !== windowId) return;

        // Check if this tab is still the active one
        if (!tabsController.isTabActive(tab)) {
          // Tab is no longer active — hide overlay but keep session alive
          try {
            tab.getWindow().sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");
          } catch {
            // Window may already be destroyed
          }
        }
      });

      return new Promise<AssertCredentialResult | AssertCredentialErrorCodes | null>((resolve) => {
        conditionalSessions.set(tabWcId, {
          resolve: (value) => {
            // Remove cleanup listeners once resolved
            event.sender.removeListener("destroyed", cleanup);
            event.sender.removeListener("did-navigate", cleanup);
            disconnectActiveTabChanged();
            resolve(value);
          },
          publicKeyOptions,
          passkeys: listResult.credentials,
          currentOrigin,
          topFrameOrigin
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

    browserWindow.sendMessageToCoreWebContents("webauthn:conditional-show-overlay", {
      passkeys: session.passkeys,
      position
    });
  }
);

ipcMain.on("webauthn:conditional-input-blur", (event) => {
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

  const session = conditionalSessions.get(focusedTab.webContents.id);
  if (!session) return;

  // Hide the overlay immediately
  browserWindow.sendMessageToCoreWebContents("webauthn:conditional-hide-overlay");

  const webauthn = await getWebauthnAddon();
  if (!webauthn) {
    session.resolve("NotSupportedError");
    conditionalSessions.delete(focusedTab.webContents.id);
    return;
  }

  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) {
    session.resolve("NotAllowedError");
    conditionalSessions.delete(focusedTab.webContents.id);
    return;
  }

  // Build options with only the selected credential in allowCredentials
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

  if (result.success === false) {
    session.resolve(result.error);
  } else {
    session.resolve(result.data);
  }

  conditionalSessions.delete(focusedTab.webContents.id);
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

ipcMain.handle("webauthn:is-conditional-available", async (): Promise<boolean> => {
  if (getSettingValueById("enablePasskeyAutofill") === false) {
    return false;
  }
  const webauthn = await getWebauthnAddon();
  return webauthn !== null;
});

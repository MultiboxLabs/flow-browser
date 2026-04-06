import { handleGetCredential } from "@/ipc/webauthn";
import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { ipcMain, shell, type IpcMainEvent } from "electron";
import type { AssertCredentialErrorCodes, AssertCredentialResult } from "~/types/fido2-types";
import type { ConditionalPasskeyRequest, ConditionalPasskeyRequestState } from "~/types/passkey";
import { getWebauthnAddon } from "@/ipc/webauthn/module";
import { tabsController } from "@/controllers/tabs-controller";

interface PendingConditionalMediation {
  publicKeyRequestOptions: PublicKeyCredentialRequestOptions;
  event: IpcMainEvent;
  tabId: number | null;
  selectedPasskey: PublicKeyCredentialDescriptor | null;
  result: AssertCredentialResult | AssertCredentialErrorCodes | null;
  cleanup: () => void;
  state: // Starting & Started
    | "starting"
    | "started"
    // Selected Passkey & Processing Authentication
    | "selected"
    | "processing"
    // Completed & Cancelled
    | "completed"
    | "cancelled";
}

const pendingConditionalMediations = new Map<string, PendingConditionalMediation>();

function serializeConditionalRequestState(
  state: PendingConditionalMediation["state"]
): ConditionalPasskeyRequestState | null {
  switch (state) {
    case "starting":
    case "started":
    case "selected":
      return "started";
    case "processing":
      return "processing";
    default:
      return null;
  }
}

function getSerializedConditionalRequests(): ConditionalPasskeyRequest[] {
  return Array.from(pendingConditionalMediations.entries()).flatMap(([operationId, mediation]) => {
    const state = serializeConditionalRequestState(mediation.state);
    if (!state) {
      return [];
    }

    return [
      {
        operationId,
        rpId: mediation.publicKeyRequestOptions.rpId ?? "",
        tabId: mediation.tabId,
        state
      }
    ];
  });
}

function pendingOperationsChanged() {
  sendMessageToListeners("passkey:on-conditional-requests-updated", getSerializedConditionalRequests());
}

async function progressConditionalMediation(operationId: string) {
  const pendingConditionalMediation = pendingConditionalMediations.get(operationId);
  if (!pendingConditionalMediation) {
    return false;
  }

  if (pendingConditionalMediation.state === "starting") {
    // Just starting, tell main browser UI about this new operation
    pendingConditionalMediation.state = "started";
    pendingOperationsChanged();
    return true;
  } else if (pendingConditionalMediation.state === "started") {
    // Already started, do nothing
    return true;
  } else if (pendingConditionalMediation.state === "selected") {
    // Prompt user to authenticate with the selected passkey
    const { event, publicKeyRequestOptions, selectedPasskey } = pendingConditionalMediation;
    if (!selectedPasskey) {
      return false;
    }
    pendingConditionalMediation.state = "processing";
    pendingOperationsChanged();
    const updatedPublicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      ...publicKeyRequestOptions,
      allowCredentials: [selectedPasskey]
    };
    const result = await handleGetCredential(event, { publicKey: updatedPublicKeyRequestOptions });
    if (result === "NotAllowedError") {
      // Go back to starting state - pick another passkey
      pendingConditionalMediation.state = "started";
      pendingConditionalMediation.selectedPasskey = null;
      pendingOperationsChanged();
    } else {
      pendingConditionalMediation.state = "completed";
      pendingConditionalMediation.result = result;
      progressConditionalMediation(operationId);
    }
    return true;
  } else if (pendingConditionalMediation.state === "processing") {
    // Already processing, do nothing
    return true;
  } else if (pendingConditionalMediation.state === "completed") {
    // Return the result
    const { event, result, cleanup } = pendingConditionalMediation;
    cleanup();
    event.reply("webauthn:conditional-mediation-result", operationId, result);

    // Clear the pending operation
    pendingConditionalMediations.delete(operationId);
    pendingOperationsChanged();
    return true;
  } else if (pendingConditionalMediation.state === "cancelled") {
    // Cancelled, clear the pending operation
    pendingConditionalMediation.cleanup();
    pendingConditionalMediations.delete(operationId);
    pendingOperationsChanged();
    return true;
  } else {
    return false;
  }
}

// IPCs with WebAuthn Requester //
ipcMain.on(
  "webauthn:start-conditional-mediation",
  (event, operationId: string, publicKeyRequestOptions: PublicKeyCredentialRequestOptions) => {
    const webContents = event.sender;

    // Cancel when the page navigates away, reloads, or the webContents is destroyed —
    // the window context is gone and can no longer receive results.
    const cancelDueToContextLoss = () => {
      const mediation = pendingConditionalMediations.get(operationId);
      if (mediation) {
        mediation.state = "cancelled";
        progressConditionalMediation(operationId);
      }
    };
    webContents.on("did-navigate", cancelDueToContextLoss);
    webContents.on("destroyed", cancelDueToContextLoss);

    const tabId = tabsController.getTabByWebContents(webContents)?.id ?? null;

    pendingConditionalMediations.set(operationId, {
      publicKeyRequestOptions,
      event,
      tabId,
      selectedPasskey: null,
      result: null,
      state: "starting",
      cleanup: () => {
        webContents.off("did-navigate", cancelDueToContextLoss);
        webContents.off("destroyed", cancelDueToContextLoss);
      }
    });
    progressConditionalMediation(operationId);
  }
);

ipcMain.on("webauthn:cancel-conditional-mediation", (_event, operationId: string) => {
  const pendingConditionalMediation = pendingConditionalMediations.get(operationId);
  if (!pendingConditionalMediation) {
    return;
  }
  pendingConditionalMediation.state = "cancelled";
  progressConditionalMediation(operationId);
});

// IPCs with Flow Browser UI //
ipcMain.handle("passkey:get-conditional-requests", (): ConditionalPasskeyRequest[] => {
  return getSerializedConditionalRequests();
});

ipcMain.handle("passkey:has-permission-to-list-passkeys", async () => {
  const webauthn = await getWebauthnAddon();
  if (!webauthn) {
    return "denied";
  }

  const result = await webauthn.getListPasskeyAuthorizationStatus();
  if (result.success === false) {
    return "denied";
  }
  return result.status;
});

ipcMain.handle("passkey:request-list-passkeys-permission", async () => {
  const webauthn = await getWebauthnAddon();
  if (!webauthn) {
    return "denied";
  }

  const result = await webauthn.requestListPasskeyAuthorization();
  if (result.success === false) {
    return "denied";
  }
  return result.status;
});

ipcMain.handle("passkey:list-passkeys", async (_, rpId: string) => {
  const webauthn = await getWebauthnAddon();
  if (!webauthn) {
    return [];
  }

  const passkeys = await webauthn.listPasskeys(rpId);
  if (passkeys.success === false) {
    return [];
  }
  return passkeys.credentials;
});

ipcMain.handle("passkey:select-conditional-passkey", async (_event, operationId: string, credentialId: string) => {
  const pending = pendingConditionalMediations.get(operationId);
  if (!pending || pending.state !== "started") return false;

  pending.selectedPasskey = {
    id: Buffer.from(credentialId, "base64url"),
    type: "public-key"
  };
  pending.state = "selected";
  await progressConditionalMediation(operationId);
  return true;
});

ipcMain.handle("passkey:open-system-settings", async () => {
  if (process.platform !== "darwin") {
    return false;
  }

  await shell.openExternal("x-apple.systempreferences:com.apple.preference.security?Privacy_PasskeyAccess", {
    activate: true
  });
  return true;
});

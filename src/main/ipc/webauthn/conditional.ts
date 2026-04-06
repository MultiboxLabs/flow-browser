import { handleGetCredential } from "@/ipc/webauthn";
import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import type { AssertCredentialErrorCodes, AssertCredentialResult } from "~/types/fido2-types";
import type { ConditionalPasskeyRequest } from "~/types/passkey";
import { getWebauthnAddon } from "@/ipc/webauthn/module";

interface PendingConditionalMediation {
  publicKeyRequestOptions: PublicKeyCredentialRequestOptions;
  event: IpcMainInvokeEvent;
  selectedPasskey: PublicKeyCredentialDescriptor | null;
  result: AssertCredentialResult | AssertCredentialErrorCodes | null;
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

function getSerializedConditionalRequests(): ConditionalPasskeyRequest[] {
  return Array.from(pendingConditionalMediations.entries()).map(([operationId, mediation]) => ({
    operationId,
    rpId: mediation.publicKeyRequestOptions.rpId ?? "",
    state: mediation.state
  }));
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
    const { event, result } = pendingConditionalMediation;
    const senderFrame = event.senderFrame;
    if (senderFrame) {
      senderFrame.send("webauthn:conditional-mediation-result", operationId, result);
    }

    // Clear the pending operation
    pendingConditionalMediations.delete(operationId);
    pendingOperationsChanged();
    return true;
  } else if (pendingConditionalMediation.state === "cancelled") {
    // Cancelled, clear the pending operation
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
    pendingConditionalMediations.set(operationId, {
      publicKeyRequestOptions,
      event,
      selectedPasskey: null,
      result: null,
      state: "started"
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

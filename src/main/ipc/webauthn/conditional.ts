import { handleGetCredential } from "@/ipc/webauthn";
import { ipcMain, type IpcMainInvokeEvent } from "electron";
import type { AssertCredentialErrorCodes, AssertCredentialResult } from "~/types/fido2-types";

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

function pendingOperationsChanged(operation: "new" | "updated" | "removed", operationId: string) {
  // TODO: communicate with main browser UI about the changes
  void operation;
  void operationId;
}

async function progressConditionalMediation(operationId: string) {
  const pendingConditionalMediation = pendingConditionalMediations.get(operationId);
  if (!pendingConditionalMediation) {
    return false;
  }

  if (pendingConditionalMediation.state === "starting") {
    // Just starting, tell main browser UI about this new operation
    pendingOperationsChanged("new", operationId);
    pendingConditionalMediation.state = "started";
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
    pendingOperationsChanged("updated", operationId);
    const updatedPublicKeyRequestOptions: PublicKeyCredentialRequestOptions = {
      ...publicKeyRequestOptions,
      allowCredentials: [selectedPasskey]
    };
    const result = await handleGetCredential(event, { publicKey: updatedPublicKeyRequestOptions });
    if (result === "NotAllowedError") {
      // Go back to starting state - pick another passkey
      pendingConditionalMediation.state = "started";
      pendingConditionalMediation.selectedPasskey = null;
      pendingOperationsChanged("updated", operationId);
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
    pendingOperationsChanged("removed", operationId);
    return true;
  } else if (pendingConditionalMediation.state === "cancelled") {
    // Cancelled, clear the pending operation
    pendingConditionalMediations.delete(operationId);
    pendingOperationsChanged("removed", operationId);
    return true;
  } else {
    return false;
  }
}

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

import * as webauthn from "@electron-webauthn/native";
import { BrowserWindow, ipcMain } from "electron";

// Helper function to convert BufferSource to Buffer
function toBuffer(data: BufferSource | undefined): Buffer {
  if (!data) return Buffer.alloc(0);
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
  return Buffer.alloc(0);
}

// Helper function to convert Buffer to ArrayBuffer
function toArrayBuffer(buffer: Buffer): ArrayBuffer {
  const arrayBuffer = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return arrayBuffer;
}

ipcMain.handle(
  "webauthn:create",
  async (_event, options: CredentialCreationOptions | undefined): Promise<PublicKeyCredential | null> => {
    // TODO: Implement create
    console.log("create", options);

    return null;
  }
);

ipcMain.handle(
  "webauthn:get",
  async (_event, options: CredentialRequestOptions | undefined): Promise<PublicKeyCredential | null> => {
    if (!options) {
      return null;
    }

    // Conditional mediation is not supported yet
    if (options.mediation === "conditional") {
      return null;
    }

    console.log("get", options);

    const publicKeyOptions = options.publicKey;
    if (!publicKeyOptions) {
      return null;
    }

    const allowCredentials: webauthn.PublicKeyCredentialDescriptor[] =
      publicKeyOptions.allowCredentials?.map((cred) => ({
        type: cred.type,
        id: toBuffer(cred.id),
        transports: cred.transports
      })) ?? [];

    const windowHandle = BrowserWindow.getFocusedWindow()?.getNativeWindowHandle();
    if (!windowHandle) {
      return null;
    }

    const credential = await webauthn.get({
      challenge: toBuffer(publicKeyOptions.challenge),
      rpId: publicKeyOptions.rpId,
      timeout: publicKeyOptions.timeout,
      userVerification: publicKeyOptions.userVerification,
      allowCredentials: allowCredentials,
      windowHandle
    });

    const publicKeyCredential: PublicKeyCredential = {
      authenticatorAttachment: credential.authenticatorAttachment ?? null,
      getClientExtensionResults: () => ({}),
      id: credential.id ?? null,
      rawId: toArrayBuffer(credential.rawId),
      type: credential.type ?? null,
      response: {
        clientDataJSON: toArrayBuffer(credential.response)
      },
      toJSON() {
        const cloned: Partial<PublicKeyCredential> = {
          ...publicKeyCredential
        };
        delete cloned.toJSON;
        delete cloned.getClientExtensionResults;
        return JSON.stringify(cloned);
      }
    };
    return publicKeyCredential;
  }
);

ipcMain.handle("webauthn:is-available", async (): Promise<boolean> => {
  const isSupported = await webauthn.isSupported();
  console.log("webauthn:is-available", isSupported);
  return isSupported;
});

import { isPublicSuffix } from "@/ipc/webauthn/psl-check";
import { isRpIdAllowedForOrigin } from "@/ipc/webauthn/rpid-validator";
import { BrowserWindow, ipcMain } from "electron";
import * as webauthn from "electron-webauthn";
import type { AssertCredentialErrorCodes, AssertCredentialResult } from "~/types/fido2-types";

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

/**
 * Convert an ArrayBuffer to a base64url string.
 */
function bufferToBase64Url(buffer: Buffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

ipcMain.handle("webauthn:create", async (_event, options: CredentialCreationOptions | undefined): Promise<null> => {
  // TODO: Implement create
  console.log("create", options);

  if (!options) {
    return null;
  }

  const publicKeyOptions = options.publicKey;
  if (!publicKeyOptions) {
    return null;
  }

  return null;
});

ipcMain.handle(
  "webauthn:get",
  async (
    event,
    options: CredentialRequestOptions | undefined
  ): Promise<AssertCredentialResult | AssertCredentialErrorCodes | null> => {
    // TODO: implement timeout

    if (!options) {
      return null;
    }

    // Conditional mediation is not supported yet
    if (options.mediation === "conditional") {
      return "NotSupportedError";
    }

    const publicKeyOptions = options.publicKey;
    if (!publicKeyOptions) {
      return null;
    }

    const rpId = publicKeyOptions.rpId;
    if (!rpId) {
      return null;
    }

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

    const isRpIdAllowed = isRpIdAllowedForOrigin(currentOrigin, rpId, { isPublicSuffix });
    console.log("isRpIdAllowed", isRpIdAllowed.ok);
    if (!isRpIdAllowed.ok) {
      return "NotAllowedError";
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return null;
    }

    const challenge = bufferSourceToBuffer(publicKeyOptions.challenge);

    const allowedCredentialsArray: Buffer[] = [];
    const allowedCredentials = publicKeyOptions.allowCredentials;
    if (allowedCredentials) {
      for (const allowedCredential of allowedCredentials) {
        if (allowedCredential.type !== "public-key") continue;
        allowedCredentialsArray.push(bufferSourceToBuffer(allowedCredential.id));
      }
    }

    let largeBlobWriteBuffer: Buffer | undefined;

    const extensions: webauthn.CredentialAssertionExtensions[] = [];
    if (publicKeyOptions.extensions?.largeBlob) {
      const largeBlobConfig = publicKeyOptions.extensions.largeBlob;
      if (largeBlobConfig.read) {
        extensions.push("largeBlobRead");
      }
      if (largeBlobConfig.write) {
        extensions.push("largeBlobWrite");
        largeBlobWriteBuffer = bufferSourceToBuffer(largeBlobConfig.write);
      }
    }

    let prf: webauthn.PRFInput | undefined;
    let prfByCredential: Record<string, webauthn.PRFInput> | undefined;

    const prfExtension = publicKeyOptions.extensions?.prf;
    if (prfExtension && (prfExtension.eval || prfExtension.evalByCredential)) {
      extensions.push("prf");

      if (prfExtension.eval) {
        prf = {
          first: bufferSourceToBuffer(prfExtension.eval.first),
          second: prfExtension.eval.second ? bufferSourceToBuffer(prfExtension.eval.second) : undefined
        };
      }

      if (prfExtension.evalByCredential) {
        prfByCredential = {};
        for (const [credId, value] of Object.entries(prfExtension.evalByCredential)) {
          prfByCredential[credId] = {
            first: bufferSourceToBuffer(value.first),
            second: value.second ? bufferSourceToBuffer(value.second) : undefined
          };
        }
      }
    }

    const userVerification: webauthn.UserVerificationPreference = publicKeyOptions.userVerification ?? "preferred";
    const getResult = await webauthn
      .getCredential(
        rpId,
        challenge,
        win.getNativeWindowHandle(),
        currentOrigin,
        extensions,
        allowedCredentialsArray,
        userVerification,
        { largeBlobDataToWrite: largeBlobWriteBuffer, prf, prfByCredential, topFrameOrigin }
      )
      .catch((error: Error) => {
        console.error("Error getting credential", error);
        if (error.message.startsWith("The operation couldn’t be completed.")) {
          return "NotAllowedError";
        }
        return null;
      });

    if (!getResult || typeof getResult === "string") {
      return getResult;
    }

    const result: AssertCredentialResult = {
      credentialId: bufferToBase64Url(getResult.id),
      clientDataJSON: bufferToBase64Url(getResult.clientDataJSON),
      authenticatorData: bufferToBase64Url(getResult.authenticatorData),
      signature: bufferToBase64Url(getResult.signature),
      userHandle: bufferToBase64Url(getResult.userHandle),
      extensions: {}
    };

    // Add PRF extension results if available
    if (getResult.prf && (getResult.prf[0] || getResult.prf[1])) {
      result.extensions!.prf = {
        results: {
          first: bufferToBase64Url(getResult.prf[0]!),
          second: getResult.prf[1] ? bufferToBase64Url(getResult.prf[1]) : undefined
        }
      };
    }

    // Add largeBlob extension results if available
    if (getResult.largeBlob || getResult.largeBlobWritten) {
      result.extensions!.largeBlob = {
        blob: getResult.largeBlob ? bufferToBase64Url(getResult.largeBlob) : undefined,
        written: getResult.largeBlobWritten !== null ? getResult.largeBlobWritten : undefined
      };
    }

    return result;
  }
);

ipcMain.handle("webauthn:is-available", async (): Promise<boolean> => {
  // const isSupported = await webauthn.isSupported();
  // console.log("webauthn:is-available", isSupported);
  // return isSupported;
  return true;
});

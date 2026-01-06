import { isPublicSuffix } from "@/ipc/webauthn/psl-check";
import { isRpIdAllowedForOrigin } from "@/ipc/webauthn/rpid-validator";
import { BrowserWindow, ipcMain } from "electron";
import * as webauthn from "electron-webauthn";
import type {
  AssertCredentialErrorCodes,
  AssertCredentialResult,
  CreateCredentialErrorCodes,
  CreateCredentialResult
} from "~/types/fido2-types";

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

ipcMain.handle(
  "webauthn:create",
  async (
    event,
    options: CredentialCreationOptions | undefined
  ): Promise<CreateCredentialResult | CreateCredentialErrorCodes | null> => {
    console.log("create", options);

    if (!options) {
      return null;
    }

    const publicKeyOptions = options.publicKey;
    if (!publicKeyOptions) {
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

    let rpId: string = senderFrame.origin;
    if (publicKeyOptions.rp.id) {
      rpId = publicKeyOptions.rp.id;
    }

    const isRpIdAllowed = isRpIdAllowedForOrigin(currentOrigin, rpId, { isPublicSuffix });
    if (!isRpIdAllowed.ok) {
      return "NotAllowedError";
    }

    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return null;
    }

    const challenge = bufferSourceToBuffer(publicKeyOptions.challenge);

    // Prepare extensions array
    const extensions: webauthn.CredentialCreationExtensions[] = [];
    if (publicKeyOptions.extensions?.largeBlob) {
      extensions.push("largeBlob");
    }
    if (publicKeyOptions.extensions?.prf) {
      extensions.push("prf");
    }

    // Prepare attestation preference
    type CredentialAttestationPreference = "direct" | "enterprise" | "indirect" | "none";
    const attestation: CredentialAttestationPreference = publicKeyOptions.attestation || "none";

    // Prepare exclude credentials
    const excludeCredentials: webauthn.ExcludeCredential[] = [];
    if (publicKeyOptions.excludeCredentials) {
      for (const excludeCredential of publicKeyOptions.excludeCredentials) {
        if (excludeCredential.type !== "public-key") continue;
        excludeCredentials.push({
          id: bufferSourceToBuffer(excludeCredential.id),
          transports: excludeCredential.transports
        });
      }
    }

    // Prepare authenticator selection
    const residentKeyRequired =
      publicKeyOptions.authenticatorSelection?.residentKey === "required" ||
      publicKeyOptions.authenticatorSelection?.requireResidentKey === true;
    type CredentialUserVerificationPreference = "required" | "preferred" | "discouraged";
    const userVerification: CredentialUserVerificationPreference =
      publicKeyOptions.authenticatorSelection?.userVerification ?? "preferred";

    // Prepare additional options
    interface CreateCredentialAdditionalOptions {
      topFrameOrigin?: string;
      userDisplayName?: string;
      largeBlobSupport?: "required" | "preferred" | "unspecified";
      prf?: webauthn.PRFInput;
    }
    const additionalOptions: CreateCredentialAdditionalOptions = {
      topFrameOrigin,
      userDisplayName: publicKeyOptions.user.displayName
    };

    // Handle largeBlob extension
    if (publicKeyOptions.extensions?.largeBlob) {
      const largeBlobConfig = publicKeyOptions.extensions.largeBlob;
      if (largeBlobConfig.support === "required") {
        additionalOptions.largeBlobSupport = "required";
      } else if (largeBlobConfig.support === "preferred") {
        additionalOptions.largeBlobSupport = "preferred";
      }
    }

    // Handle PRF extension
    if (publicKeyOptions.extensions?.prf?.eval) {
      const prfEval = publicKeyOptions.extensions.prf.eval;
      additionalOptions.prf = {
        first: bufferSourceToBuffer(prfEval.first),
        second: prfEval.second ? bufferSourceToBuffer(prfEval.second) : undefined
      };
    }

    // Convert pubKeyCredParams to the format expected by electron-webauthn
    const supportedAlgorithmIdentifiers = publicKeyOptions.pubKeyCredParams.map((param) => ({
      type: "public-key" as const,
      algorithm: param.alg
    }));

    const createResult = await webauthn
      .createCredential(
        rpId,
        challenge,
        publicKeyOptions.user.name,
        bufferSourceToBuffer(publicKeyOptions.user.id),
        win.getNativeWindowHandle(),
        currentOrigin,
        extensions,
        attestation,
        supportedAlgorithmIdentifiers,
        excludeCredentials,
        residentKeyRequired,
        userVerification,
        additionalOptions
      )
      .catch((error: Error) => {
        console.error("Error creating credential", error);
        console.log("error.message", error.message);
        if (error.message.includes("(com.apple.AuthenticationServices.AuthorizationError error 1006.)")) {
          // MatchedExcludedCredential
          return "InvalidStateError";
        }
        if (error.message.startsWith("The operation couldn’t be completed.")) {
          return "NotAllowedError";
        }
        return null;
      });

    if (typeof createResult === "string") {
      return createResult;
    }

    if (!createResult) {
      return null;
    }

    // TODO: The electron-webauthn library currently returns an empty object.
    // Once the library is updated to return actual credential data, we need to:
    // 1. Parse the result and convert buffers to base64url strings
    // 2. Return a CreateCredentialResult object with all required fields
    // 3. Update the preload to use WebauthnUtils.mapCredentialRegistrationResult()
    const result: CreateCredentialResult = {
      credentialId: bufferToBase64Url(createResult.credentialId),
      clientDataJSON: bufferToBase64Url(createResult.clientDataJSON),
      attestationObject: bufferToBase64Url(createResult.attestationObject),
      authData: bufferToBase64Url(createResult.authenticatorData),
      publicKey: bufferToBase64Url(createResult.publicKey),
      publicKeyAlgorithm: createResult.publicKeyAlgorithm,
      transports: createResult.transports,
      extensions: {}
    };

    // credProps extension
    if (publicKeyOptions.extensions?.credProps) {
      result.extensions.credProps = {
        rk: createResult.isResidentKey
      };
    }

    return result;
  }
);

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

    const publicKeyOptions = options.publicKey;

    // Conditional mediation is not supported yet
    if (options.mediation === "conditional") {
      return "NotSupportedError";
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

ipcMain.handle("webauthn:is-available", async (): Promise<boolean> => {
  // const isSupported = await webauthn.isSupported();
  // console.log("webauthn:is-available", isSupported);
  // return isSupported;
  return true;
});

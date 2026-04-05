import { ipcRenderer, contextBridge } from "electron";

import type {
  AssertCredentialErrorCodes,
  AssertCredentialResult,
  CreateCredentialErrorCodes,
  CreateCredentialResult
} from "~/types/fido2-types";
import { WebauthnUtils } from "./webauthn-utils";

export function tryPatchPasskeys() {
  const SHOULD_PATCH_PASSKEYS = "navigator" in globalThis && "credentials" in globalThis.navigator;
  if (SHOULD_PATCH_PASSKEYS) {
    type PatchedCredentialsContainer = Pick<CredentialsContainer, "create" | "get"> & {
      isAvailable: () => Promise<boolean>;
      isConditionalMediationAvailable: () => Promise<boolean>;
    };

    let isWebauthnAddonAvailablePromise: Promise<boolean> | null = null;

    const patchedCredentialsContainer: PatchedCredentialsContainer = {
      // @ts-expect-error: just not gonna bother with the error types
      create: async (options) => {
        const serialized: CreateCredentialResult | CreateCredentialErrorCodes | null = await ipcRenderer.invoke(
          "webauthn:create",
          options
        );

        if (!serialized) return null;
        if (typeof serialized === "string") {
          return serialized;
        }

        const publicKeyCredential = WebauthnUtils.mapCredentialRegistrationResult(serialized);
        return publicKeyCredential;
      },
      // @ts-expect-error: just not gonna bother with the error types
      get: async (options) => {
        const serialized: AssertCredentialResult | AssertCredentialErrorCodes | null = await ipcRenderer.invoke(
          "webauthn:get",
          options
        );

        if (!serialized) return null;
        if (typeof serialized === "string") {
          return serialized;
        }

        const publicKeyCredential = WebauthnUtils.mapCredentialAssertResult(serialized);
        return publicKeyCredential;
      },
      isAvailable: async () => {
        if (isWebauthnAddonAvailablePromise) {
          return isWebauthnAddonAvailablePromise;
        }
        isWebauthnAddonAvailablePromise = ipcRenderer.invoke("webauthn:is-available");
        return isWebauthnAddonAvailablePromise;
      },
      isConditionalMediationAvailable: async () => {
        return false;
      }
    };
    contextBridge.exposeInMainWorld("electronCredentials", patchedCredentialsContainer);

    const tinyPasskeysScript = () => {
      if ("electronCredentials" in globalThis) {
        const patchedCredentials: typeof patchedCredentialsContainer = globalThis.electronCredentials;

        let shouldUseMacOSWebauthnAddon_cached: boolean | null = null;
        async function shouldUseMacOSWebauthnAddon(): Promise<boolean> {
          if (shouldUseMacOSWebauthnAddon_cached !== null) {
            return shouldUseMacOSWebauthnAddon_cached;
          }

          if (await patchedCredentials.isAvailable()) {
            shouldUseMacOSWebauthnAddon_cached = true;
            return true;
          } else {
            shouldUseMacOSWebauthnAddon_cached = false;
            return false;
          }
        }

        if ("navigator" in globalThis && "credentials" in globalThis.navigator) {
          const credentials = globalThis.navigator.credentials;
          const oldCredentialsCreate = credentials.create.bind(credentials);
          const oldCredentialsGet = credentials.get.bind(credentials);

          // navigator.credentials.create()
          credentials.create = async (options) => {
            if (options && (await shouldUseMacOSWebauthnAddon())) {
              if (options.publicKey) {
                const result = await patchedCredentials.create(options);

                // Cannot throw errors in patchedCredentials, so we need to handle the errors here.
                const errorCode = result as unknown as CreateCredentialErrorCodes;
                if (errorCode === "NotAllowedError") {
                  // Mirror Chromium's error message.
                  throw new DOMException(
                    "The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.",
                    "NotAllowedError"
                  );
                } else if (errorCode === "SecurityError") {
                  throw new DOMException("The calling domain is not a valid domain.", "SecurityError");
                } else if (errorCode === "TypeError") {
                  throw new DOMException("Failed to parse arguments.", "TypeError");
                } else if (errorCode === "AbortError") {
                  throw new DOMException("The operation was aborted.", "AbortError");
                } else if (errorCode === "NotSupportedError") {
                  throw new DOMException("The user agent does not support this operation.", "NotSupportedError");
                } else if (errorCode === "InvalidStateError") {
                  throw new DOMException(
                    "The user attempted to register an authenticator that contains one of the credentials already registered with the relying party.",
                    "InvalidStateError"
                  );
                }

                return result;
              }
            }

            return await oldCredentialsCreate(options);
          };

          // navigator.credentials.get()
          credentials.get = async (options) => {
            if (options && (await shouldUseMacOSWebauthnAddon())) {
              // Conditional mediation is not supported yet
              if (options.mediation === "conditional") {
                throw new DOMException("The user agent does not support this operation.", "NotSupportedError");
              }

              if (options.publicKey) {
                const result = await patchedCredentials.get(options);

                // Cannot throw errors in patchedCredentials, so we need to handle the errors here.
                const errorCode = result as unknown as AssertCredentialErrorCodes;
                if (errorCode === "NotAllowedError") {
                  // Mirror Chromium's error message.
                  throw new DOMException(
                    "The operation either timed out or was not allowed. See: https://www.w3.org/TR/webauthn-2/#sctn-privacy-considerations-client.",
                    "NotAllowedError"
                  );
                } else if (errorCode === "SecurityError") {
                  throw new DOMException("The calling domain is not a valid domain.", "SecurityError");
                } else if (errorCode === "TypeError") {
                  throw new DOMException("Failed to parse arguments.", "TypeError");
                } else if (errorCode === "AbortError") {
                  throw new DOMException("The operation was aborted.", "AbortError");
                } else if (errorCode === "NotSupportedError") {
                  throw new DOMException("The user agent does not support this operation.", "NotSupportedError");
                }

                return result;
              }
            }

            return await oldCredentialsGet(options);
          };
        }

        if (
          "PublicKeyCredential" in globalThis &&
          "isUserVerifyingPlatformAuthenticatorAvailable" in globalThis.PublicKeyCredential
        ) {
          const PublicKeyCredential = globalThis.PublicKeyCredential;

          // PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          const oldIsUserVerifyingPlatformAuthenticatorAvailable =
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.bind(PublicKeyCredential);
          PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = async () => {
            if (await patchedCredentials.isAvailable()) {
              return await patchedCredentials.isAvailable();
            }
            return await oldIsUserVerifyingPlatformAuthenticatorAvailable();
          };

          // PublicKeyCredential.isConditionalMediationAvailable()
          const oldIsConditionalMediationAvailable =
            PublicKeyCredential.isConditionalMediationAvailable.bind(PublicKeyCredential);
          PublicKeyCredential.isConditionalMediationAvailable = async () => {
            if (await patchedCredentials.isAvailable()) {
              return await patchedCredentials.isConditionalMediationAvailable();
            }
            return await oldIsConditionalMediationAvailable();
          };
        }

        delete globalThis.electronCredentials;
      }
    };
    contextBridge.executeInMainWorld({
      func: tinyPasskeysScript
    });
    return true;
  }
  return false;
}

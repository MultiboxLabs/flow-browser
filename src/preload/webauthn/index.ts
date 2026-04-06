import { ipcRenderer, contextBridge, type IpcRendererEvent } from "electron";
import { generateID } from "../utils";

import type {
  AssertCredentialErrorCodes,
  AssertCredentialResult,
  CreateCredentialErrorCodes,
  CreateCredentialResult
} from "~/types/fido2-types";
import { WebauthnUtils } from "./webauthn-utils";

let hasConditionalMediationLock = false;

async function handleConditionalMediation(options: CredentialRequestOptions) {
  if (hasConditionalMediationLock) {
    return "OperationError";
  }
  hasConditionalMediationLock = true;

  const operationId = generateID();
  const publicKeyRequestOptions = options.publicKey;
  ipcRenderer.send("webauthn:start-conditional-mediation", operationId, publicKeyRequestOptions);

  const { resolve, promise } = Promise.withResolvers<AssertCredentialResult | AssertCredentialErrorCodes | null>();

  const abortSignal = options.signal;
  if (abortSignal) {
    const onAbort = () => {
      ipcRenderer.send("webauthn:cancel-conditional-mediation", operationId);
      resolve("AbortError");
    };

    if (abortSignal.aborted) {
      onAbort();
    } else {
      try {
        abortSignal.addEventListener("abort", onAbort, { once: true });
      } catch (error) {
        console.error("error adding abort listener", error);
      }
    }
  }

  const onConditionalMediationResult = (
    _event: IpcRendererEvent,
    opId: string,
    result: AssertCredentialResult | AssertCredentialErrorCodes | null
  ) => {
    if (opId !== operationId) {
      return;
    }
    resolve(result);
  };
  ipcRenderer.on("webauthn:conditional-mediation-result", onConditionalMediationResult);

  // Cleanup when the promise is resolved or rejected
  promise.finally(() => {
    hasConditionalMediationLock = false;
    ipcRenderer.off("webauthn:conditional-mediation-result", onConditionalMediationResult);
  });
  return await promise;
}

const abortControllers = new Map<string, AbortController>();
function createAbortSignal(abortId?: string) {
  if (typeof abortId !== "string") return null;

  const abortController = new AbortController();
  const abortSignal = abortController.signal;
  abortControllers.set(abortId, abortController);
  return abortSignal;
}

export function tryPatchPasskeys() {
  const SHOULD_PATCH_PASSKEYS = "navigator" in globalThis && "credentials" in globalThis.navigator;
  if (SHOULD_PATCH_PASSKEYS) {
    type PatchedCredentialsContainer = Pick<CredentialsContainer, "create"> & {
      get: (
        options: CredentialRequestOptions,
        abortId?: string
      ) => Promise<AssertCredentialErrorCodes | PublicKeyCredential | null>;
      abort: (abortId: string) => void;

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
      get: async (options, abortId?: string) => {
        const abortSignal = createAbortSignal(abortId);
        if (abortSignal) {
          options.signal = abortSignal;
        }

        let serialized: AssertCredentialResult | AssertCredentialErrorCodes | null;
        if (options && options.mediation === "conditional") {
          serialized = await handleConditionalMediation(options);
        } else {
          serialized = await ipcRenderer.invoke("webauthn:get", options);
        }

        if (abortId) {
          abortControllers.delete(abortId);
        }

        if (!serialized) return null;
        if (typeof serialized === "string") {
          return serialized;
        }

        const publicKeyCredential = WebauthnUtils.mapCredentialAssertResult(serialized);
        return publicKeyCredential;
      },
      abort: (abortId: string) => {
        const abortController = abortControllers.get(abortId);
        if (abortController) {
          abortController.abort();
          abortControllers.delete(abortId);
        }
      },
      isAvailable: async () => {
        if (isWebauthnAddonAvailablePromise) {
          return isWebauthnAddonAvailablePromise;
        }
        isWebauthnAddonAvailablePromise = ipcRenderer.invoke("webauthn:is-available");
        return isWebauthnAddonAvailablePromise;
      },
      isConditionalMediationAvailable: async () => {
        return true;
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
              if (options.publicKey) {
                // Generate abort ID and run `patchedCredentials.get()`
                const abortId = crypto.randomUUID();
                const result = await patchedCredentials.get(options, abortId);

                // Handle abort signal
                const abortSignal = options?.signal;
                if (abortSignal) {
                  const onAbort = () => {
                    patchedCredentials.abort(abortId);
                  };

                  try {
                    if (abortSignal.aborted) {
                      onAbort();
                    } else {
                      abortSignal.addEventListener("abort", onAbort, { once: true });
                    }
                  } catch (error) {
                    console.error("error adding abort listener", error);
                  }
                }

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
                } else if (errorCode === "OperationError") {
                  throw new DOMException("A request is already pending.", "OperationError");
                }

                return result as PublicKeyCredential | null;
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

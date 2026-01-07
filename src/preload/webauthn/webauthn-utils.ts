import type {
  CreateCredentialResult,
  AssertCredentialResult,
  AssertCredentialParams,
  CreateCredentialParams
} from "~/types/fido2-types";
import { Fido2Utils } from "./fido2-utils";

export class WebauthnUtils {
  static mapCredentialCreationOptions(
    options: CredentialCreationOptions,
    fallbackSupported: boolean,
    origin: string,
    sameOriginWithAncestors: boolean
  ): CreateCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == null) {
      throw new Error("Public-key options not found");
    }

    return {
      origin,
      sameOriginWithAncestors,
      attestation: keyOptions.attestation,
      authenticatorSelection: {
        requireResidentKey: keyOptions.authenticatorSelection?.requireResidentKey,
        residentKey: keyOptions.authenticatorSelection?.residentKey,
        userVerification: keyOptions.authenticatorSelection?.userVerification
      },
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      excludeCredentials: keyOptions.excludeCredentials?.map((credential) => ({
        id: Fido2Utils.bufferToString(credential.id),
        transports: credential.transports,
        type: credential.type
      })),
      extensions: {
        credProps: keyOptions.extensions?.credProps,
        prf: keyOptions.extensions?.prf
          ? {
              eval: keyOptions.extensions.prf.eval
                ? {
                    first: Fido2Utils.bufferToString(keyOptions.extensions.prf.eval.first),
                    second: keyOptions.extensions.prf.eval.second
                      ? Fido2Utils.bufferToString(keyOptions.extensions.prf.eval.second)
                      : undefined
                  }
                : undefined,
              evalByCredential: keyOptions.extensions.prf.evalByCredential
                ? Object.fromEntries(
                    Object.entries(keyOptions.extensions.prf.evalByCredential).map(([credId, value]) => [
                      credId,
                      {
                        first: Fido2Utils.bufferToString(value.first),
                        second: value.second ? Fido2Utils.bufferToString(value.second) : undefined
                      }
                    ])
                  )
                : undefined
            }
          : undefined,
        largeBlob: keyOptions.extensions?.largeBlob
          ? ({
              support: keyOptions.extensions.largeBlob.support as "required" | "preferred" | undefined,
              read: keyOptions.extensions.largeBlob.read,
              write: keyOptions.extensions.largeBlob.write
                ? Fido2Utils.bufferToString(keyOptions.extensions.largeBlob.write)
                : undefined
            } as const)
          : undefined
      },
      pubKeyCredParams: keyOptions.pubKeyCredParams
        .map((params) => ({
          // Fix for spec-deviation: Sites using KeycloakJS send `kp.alg` as a string
          alg: Number(params.alg),
          type: params.type
        }))
        .filter((params) => !isNaN(params.alg)),
      rp: {
        id: keyOptions.rp.id,
        name: keyOptions.rp.name
      },
      user: {
        id: Fido2Utils.bufferToString(keyOptions.user.id),
        displayName: keyOptions.user.displayName,
        name: keyOptions.user.name
      },
      timeout: keyOptions.timeout,
      fallbackSupported
    };
  }

  static mapCredentialRegistrationResult(result: CreateCredentialResult): PublicKeyCredential {
    const response: AuthenticatorAttestationResponse = {
      clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
      attestationObject: Fido2Utils.stringToBuffer(result.attestationObject),
      getAuthenticatorData(): ArrayBuffer {
        return Fido2Utils.stringToBuffer(result.authData);
      },
      getPublicKey(): ArrayBuffer {
        return Fido2Utils.stringToBuffer(result.publicKey);
      },
      getPublicKeyAlgorithm(): number {
        return result.publicKeyAlgorithm;
      },
      getTransports(): string[] {
        return result.transports;
      }
    };

    const extensionResults: AuthenticationExtensionsClientOutputs = {};
    if (result.extensions.credProps) {
      extensionResults.credProps = result.extensions.credProps;
    }
    if (result.extensions.prf) {
      const prfResults: {
        enabled?: boolean;
        results?: {
          first: ArrayBuffer;
          second?: ArrayBuffer;
        };
      } = {};
      if (result.extensions.prf.enabled !== undefined) {
        prfResults.enabled = result.extensions.prf.enabled;
      }
      if (result.extensions.prf.results?.first) {
        prfResults.results = {
          first: Fido2Utils.stringToBuffer(result.extensions.prf.results.first),
          second: result.extensions.prf.results.second
            ? Fido2Utils.stringToBuffer(result.extensions.prf.results.second)
            : undefined
        };
      }
      extensionResults.prf = prfResults;
    }
    if (result.extensions.largeBlob) {
      extensionResults.largeBlob = result.extensions.largeBlob;
    }

    const credential: PublicKeyCredential = {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      authenticatorAttachment: "platform",
      response,
      getClientExtensionResults: () => extensionResults,
      toJSON: () => Fido2Utils.createResultToJson(result)
    };

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAttestationResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }

  static mapCredentialRequestOptions(
    options: CredentialRequestOptions,
    fallbackSupported: boolean,
    origin: string,
    sameOriginWithAncestors: boolean
  ): AssertCredentialParams {
    const keyOptions = options.publicKey;

    if (keyOptions == null) {
      throw new Error("Public-key options not found");
    }

    if (keyOptions.rpId == null) {
      throw new Error("rpId not found");
    }

    return {
      origin,
      sameOriginWithAncestors,
      allowedCredentialIds: keyOptions.allowCredentials?.map((c) => Fido2Utils.bufferToString(c.id)) ?? [],
      challenge: Fido2Utils.bufferToString(keyOptions.challenge),
      rpId: keyOptions.rpId,
      userVerification: keyOptions.userVerification,
      timeout: keyOptions.timeout ?? 0,
      mediation: options.mediation,
      fallbackSupported,
      extensions: {
        appid: keyOptions.extensions?.appid,
        prf: keyOptions.extensions?.prf
          ? {
              eval: keyOptions.extensions.prf.eval
                ? {
                    first: Fido2Utils.bufferToString(keyOptions.extensions.prf.eval.first),
                    second: keyOptions.extensions.prf.eval.second
                      ? Fido2Utils.bufferToString(keyOptions.extensions.prf.eval.second)
                      : undefined
                  }
                : undefined,
              evalByCredential: keyOptions.extensions.prf.evalByCredential
                ? Object.fromEntries(
                    Object.entries(keyOptions.extensions.prf.evalByCredential).map(([credId, value]) => [
                      credId,
                      {
                        first: Fido2Utils.bufferToString(value.first),
                        second: value.second ? Fido2Utils.bufferToString(value.second) : undefined
                      }
                    ])
                  )
                : undefined
            }
          : undefined,
        largeBlob: keyOptions.extensions?.largeBlob
          ? {
              read: keyOptions.extensions.largeBlob.read,
              write: keyOptions.extensions.largeBlob.write
                ? Fido2Utils.bufferToString(keyOptions.extensions.largeBlob.write)
                : undefined
            }
          : undefined
      }
    };
  }

  static mapCredentialAssertResult(result: AssertCredentialResult): PublicKeyCredential {
    const response: AuthenticatorAssertionResponse = {
      authenticatorData: Fido2Utils.stringToBuffer(result.authenticatorData),
      clientDataJSON: Fido2Utils.stringToBuffer(result.clientDataJSON),
      signature: Fido2Utils.stringToBuffer(result.signature),
      userHandle: Fido2Utils.stringToBuffer(result.userHandle)
    };

    const extensionResults: AuthenticationExtensionsClientOutputs = {};

    if (result.extensions?.prf?.results) {
      extensionResults.prf = {
        results: {
          first: Fido2Utils.stringToBuffer(result.extensions.prf.results.first),
          second: result.extensions.prf.results.second
            ? Fido2Utils.stringToBuffer(result.extensions.prf.results.second)
            : undefined
        }
      };
    }

    if (result.extensions?.largeBlob) {
      extensionResults.largeBlob = {
        blob: result.extensions.largeBlob.blob
          ? Fido2Utils.stringToBuffer(result.extensions.largeBlob.blob)
          : undefined,
        written: result.extensions.largeBlob.written
      };
    }

    const credential: PublicKeyCredential = {
      id: result.credentialId,
      rawId: Fido2Utils.stringToBuffer(result.credentialId),
      type: "public-key",
      response,
      getClientExtensionResults: () => extensionResults,
      authenticatorAttachment: "platform",
      toJSON: () => Fido2Utils.getResultToJson(result)
    };

    // Modify prototype chains to fix `instanceof` calls.
    // This makes these objects indistinguishable from the native classes.
    // Unfortunately PublicKeyCredential does not have a javascript constructor so `extends` does not work here.
    Object.setPrototypeOf(credential.response, AuthenticatorAssertionResponse.prototype);
    Object.setPrototypeOf(credential, PublicKeyCredential.prototype);

    return credential;
  }
}

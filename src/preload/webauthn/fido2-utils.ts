import type { AssertCredentialResult, CreateCredentialResult } from "~/types/fido2-types";

export interface CreateCredentialJsonResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    transports: string[];
    publicKey: string;
    publicKeyAlgorithm: number;
    attestationObject: string;
  };
  authenticatorAttachment: "platform";
  clientExtensionResults: CreateCredentialResult["extensions"];
  type: "public-key";
}

export interface AssertCredentialJsonResponse {
  id: string;
  rawId: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string;
  };
  authenticatorAttachment: "platform";
  clientExtensionResults: {
    prf?: {
      results?: {
        first: string;
        second?: string;
      };
    };
    largeBlob?: {
      blob?: string;
      written?: boolean;
    };
  };
  type: "public-key";
}

export class Fido2Utils {
  static createResultToJson(result: CreateCredentialResult): CreateCredentialJsonResponse {
    return {
      id: result.credentialId,
      rawId: result.credentialId,
      response: {
        clientDataJSON: result.clientDataJSON,
        authenticatorData: result.authData,
        transports: result.transports,
        publicKey: result.publicKey,
        publicKeyAlgorithm: result.publicKeyAlgorithm,
        attestationObject: result.attestationObject
      },
      authenticatorAttachment: "platform",
      clientExtensionResults: result.extensions,
      type: "public-key"
    };
  }

  static getResultToJson(result: AssertCredentialResult): AssertCredentialJsonResponse {
    const clientExtensionResults: AssertCredentialJsonResponse["clientExtensionResults"] = {};

    if (result.extensions?.prf?.results) {
      clientExtensionResults.prf = {
        results: {
          first: result.extensions.prf.results.first,
          second: result.extensions.prf.results.second
        }
      };
    }

    if (result.extensions?.largeBlob) {
      clientExtensionResults.largeBlob = {
        blob: result.extensions.largeBlob.blob,
        written: result.extensions.largeBlob.written
      };
    }

    return {
      id: result.credentialId,
      rawId: result.credentialId,
      response: {
        clientDataJSON: result.clientDataJSON,
        authenticatorData: result.authenticatorData,
        signature: result.signature,
        userHandle: result.userHandle
      },
      authenticatorAttachment: "platform",
      clientExtensionResults,
      type: "public-key"
    };
  }

  static bufferToString(bufferSource: BufferSource): string {
    const uint8Array = Fido2Utils.bufferSourceToUint8Array(bufferSource);
    const arrayBuffer = uint8Array.buffer as ArrayBuffer;
    const b64 = Fido2Utils.fromBufferToB64(arrayBuffer);
    if (b64 === null) {
      throw new Error("Failed to convert buffer to base64");
    }
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  static stringToBuffer(str: string): ArrayBuffer {
    const array = Fido2Utils.fromB64ToArray(Fido2Utils.fromUrlB64ToB64(str));
    if (array === null) {
      throw new Error("Failed to convert base64 to array");
    }
    return array.buffer as ArrayBuffer;
  }

  static bufferSourceToUint8Array(bufferSource: BufferSource): Uint8Array {
    if (Fido2Utils.isArrayBuffer(bufferSource)) {
      return new Uint8Array(bufferSource);
    } else {
      const arrayBuffer = bufferSource.buffer as ArrayBuffer;
      return new Uint8Array(arrayBuffer, bufferSource.byteOffset, bufferSource.byteLength);
    }
  }

  /** Utility function to identify type of bufferSource. Necessary because of differences between runtimes */
  private static isArrayBuffer(bufferSource: BufferSource): bufferSource is ArrayBuffer {
    return bufferSource instanceof ArrayBuffer || bufferSource.buffer === undefined;
  }

  static fromB64toUrlB64(b64Str: string): string {
    return b64Str.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  static fromBufferToB64(buffer: ArrayBuffer | null | undefined): string | null {
    if (buffer == null) {
      return null;
    }

    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return globalThis.btoa(binary);
  }

  static fromB64ToArray(str: string | null | undefined): Uint8Array | null {
    if (str == null) {
      return null;
    }

    const binaryString = globalThis.atob(str);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  static fromUrlB64ToB64(urlB64Str: string): string {
    let output = urlB64Str.replace(/-/g, "+").replace(/_/g, "/");
    switch (output.length % 4) {
      case 0:
        break;
      case 2:
        output += "==";
        break;
      case 3:
        output += "=";
        break;
      default:
        throw new Error("Illegal base64url string!");
    }

    return output;
  }
}

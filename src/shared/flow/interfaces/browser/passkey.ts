import { IPCListener } from "~/flow/types";
import { ConditionalPasskeyRequest, PasskeyAuthorizationStatus, PasskeyCredential } from "~/types/passkey";

export interface FlowPasskeyAPI {
  /**
   * Get all currently pending conditional passkey requests.
   * @returns Array of pending conditional passkey requests
   */
  getConditionalRequests: () => Promise<ConditionalPasskeyRequest[]>;

  /**
   * Subscribe to changes in the list of conditional passkey requests.
   * Fires whenever a request is added, updated, or removed.
   * @param callback Receives the full updated list of requests
   */
  onConditionalRequestsUpdated: IPCListener<[ConditionalPasskeyRequest[]]>;

  /**
   * Check the current authorization status for listing passkeys.
   * @returns The current authorization status
   */
  hasPermissionToListPasskeys: () => Promise<PasskeyAuthorizationStatus>;

  /**
   * Request authorization to list passkeys. May prompt the user.
   * @returns The resulting authorization status after the request
   */
  requestPermissionToListPasskeys: () => Promise<PasskeyAuthorizationStatus>;

  /**
   * List passkeys stored for a given relying party.
   * @param rpId The relying party ID to filter passkeys by
   * @returns Array of matching passkey credentials
   */
  listPasskeys: (rpId: string) => Promise<PasskeyCredential[]>;
}

import { IPCListener } from "~/flow/types";
import { ConditionalPasskeyRequest } from "~/types/passkey";

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
}

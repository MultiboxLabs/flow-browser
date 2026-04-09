import { IPCListener } from "~/flow/types";
import { ActivePrompt } from "~/types/prompts";

export interface FlowPromptsAPI {
  /**
   * Get all currently pending conditional passkey requests.
   * @returns Array of pending conditional passkey requests
   */
  getActivePrompts: () => Promise<ActivePrompt[]>;

  /**
   * Subscribe to changes in the list of conditional passkey requests.
   * Fires whenever a request is added, updated, or removed.
   * @param callback Receives the full updated list of requests
   */
  onActivePromptsChanged: IPCListener<[ActivePrompt[]]>;
}

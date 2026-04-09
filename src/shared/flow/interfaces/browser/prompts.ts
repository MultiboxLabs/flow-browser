/* eslint-disable @typescript-eslint/no-explicit-any */

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

  /**
   * Confirm a prompt.
   * @param promptId The ID of the prompt to confirm
   * @param result The result of the prompt
   */
  confirmPrompt: (promptId: string, result: any) => void;
}

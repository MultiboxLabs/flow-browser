/* eslint-disable @typescript-eslint/no-explicit-any */

import { IPCListener } from "~/flow/types";
import { ActivePrompt } from "~/types/prompts";

export interface FlowPromptsAPI {
  /**
   * Get all currently pending prompts.
   * @returns Array of pending prompts
   */
  getActivePrompts: () => Promise<ActivePrompt[]>;

  /**
   * Subscribe to changes in the list of prompts.
   * Fires whenever a prompt is added, updated, or removed.
   * @param callback Receives the full updated list of prompts
   */
  onActivePromptsChanged: IPCListener<[ActivePrompt[]]>;

  /**
   * Confirm a prompt.
   * @param promptId The ID of the prompt to confirm
   * @param result The result of the prompt
   */
  confirmPrompt: (promptId: string, result: any) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

import { generateID } from "@/modules/utils";
import type { PromptState } from "~/types/prompts";

// Prompt Queue Logic //
const promptQueue: PromptState[] = [];
const activePrompts: PromptState[] = [];

function removePromptById(prompts: PromptState[], id: string) {
  const index = prompts.findIndex((prompt) => prompt.id === id);
  if (index === -1) return null;

  const [prompt] = prompts.splice(index, 1);
  return prompt;
}

function processPromptQueue() {
  for (let i = 0; i < promptQueue.length; ) {
    const queuedPrompt = promptQueue[i];
    const tabAlreadyHasActivePrompt = activePrompts.some((prompt) => prompt.tabId === queuedPrompt.tabId);

    if (tabAlreadyHasActivePrompt) {
      i += 1;
      continue;
    }

    activePrompts.push(queuedPrompt);
    promptQueue.splice(i, 1);
  }
}

export function queuePrompt(prompt: Omit<PromptState, "id">) {
  const id = generateID();
  promptQueue.push({
    id,
    ...prompt
  });

  processPromptQueue();

  return id;
}

export function cancelPrompt(id: string) {
  const queuedPrompt = removePromptById(promptQueue, id);
  if (queuedPrompt) {
    queuedPrompt.resolver({ success: false });
    return;
  }

  const activePrompt = removePromptById(activePrompts, id);
  if (!activePrompt) return;

  activePrompt.resolver({ success: false });
  processPromptQueue();
}

export function promptCompleted(promptId: string, result: any) {
  const activePrompt = removePromptById(activePrompts, promptId);
  if (!activePrompt) return false;

  activePrompt.resolver({
    success: true,
    result
  });

  processPromptQueue();
  return true;
}

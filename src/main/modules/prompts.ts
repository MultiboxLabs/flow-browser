/* eslint-disable @typescript-eslint/no-explicit-any */

import { activePromptsChanged } from "@/ipc/browser/prompts/browser";
import { generateID, onWebFrameDestroyed } from "@/modules/utils";
import type { ActivePrompt, PromptState } from "~/types/prompts";

const suppressedKeys = new Set<string>();

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
    activePromptsChanged();

    // Prompt is suppressed, cancel it
    if (queuedPrompt.suppressionKey && suppressedKeys.has(queuedPrompt.suppressionKey)) {
      cancelPrompt(queuedPrompt.id);
    }
  }
}

interface QueuePromptOptions {
  cancelOnWebFrameDetach?: { webContents: Electron.WebContents; webFrame: Electron.WebFrameMain };
}
export function queuePrompt(prompt: PromptState, options: QueuePromptOptions = {}) {
  const id = generateID();
  promptQueue.push({ ...prompt, id });

  if (options.cancelOnWebFrameDetach) {
    const { webContents, webFrame } = options.cancelOnWebFrameDetach;
    const cleanup = onWebFrameDestroyed(webContents, webFrame, () => {
      cancelPrompt(id);
    });
    prompt.promise.finally(cleanup);
  }

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
  activePromptsChanged();

  activePrompt.resolver({ success: false });
  processPromptQueue();
}

export function promptCompleted(promptId: string, result: any, suppress: boolean) {
  const activePrompt = removePromptById(activePrompts, promptId);
  if (!activePrompt) return false;

  if (suppress && activePrompt.suppressionKey) {
    suppressPrompt(activePrompt.suppressionKey);
  }

  activePromptsChanged();

  switch (activePrompt.type) {
    case "prompt":
      activePrompt.resolver({
        success: true,
        result
      });
      break;
    case "confirm":
      activePrompt.resolver({
        success: true,
        result
      });
      break;
    case "alert":
      activePrompt.resolver({
        success: true,
        result
      });
      break;
  }

  processPromptQueue();
  return true;
}

// Flow UI Communication //
export function getActivePromptsForRenderer(): ActivePrompt[] {
  const activePromptsForRenderer = activePrompts.map((prompt) => {
    const { promise, resolver, ...rest } = prompt;
    void promise;
    void resolver;
    return rest;
  });
  return activePromptsForRenderer;
}

export function suppressPrompt(suppressionKey: string) {
  if (suppressedKeys.has(suppressionKey)) return false;
  suppressedKeys.add(suppressionKey);
  return true;
}

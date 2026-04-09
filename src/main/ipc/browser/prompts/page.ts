import { tabsController } from "@/controllers/tabs-controller";
import { queuePrompt } from "@/modules/prompts";
import { ipcMain } from "electron";
import type { PromptResult, PromptState } from "~/types/prompts";

type GeneratePromptState<ResultType> = (
  promise: Promise<PromptResult<ResultType>>,
  resolve: (value: PromptResult<ResultType>) => void,
  tabId: number
) => PromptState;

async function processPromptRequest<ResultType>(
  event: Electron.IpcMainEvent,
  generatePromptState: GeneratePromptState<ResultType>,
  failedValue: ResultType
) {
  const { promise, resolve } = Promise.withResolvers<PromptResult<ResultType>>();

  const webContents = event.sender;
  const webFrame = event.senderFrame;
  const tabId = tabsController.getTabByWebContents(webContents)?.id ?? null;
  if (!tabId || !webFrame) {
    // not a tab, return null
    event.returnValue = null;
    return false;
  }

  queuePrompt(generatePromptState(promise, resolve, tabId), {
    cancelOnWebFrameDetach: { webContents, webFrame }
  });

  const result = await promise;
  if (result.success) {
    event.returnValue = result.result;
  } else {
    event.returnValue = failedValue;
  }
  return true;
}

ipcMain.on("prompts:prompt", async (event, message: string, defaultValue: string) => {
  const generatePromptState: GeneratePromptState<string | null> = (promise, resolve, tabId) => {
    return {
      // id will be overridden by the queuePrompt function
      id: "",
      type: "prompt",
      message,
      defaultValue,
      promise,
      resolver: resolve,
      tabId
    };
  };
  return processPromptRequest(event, generatePromptState, null);
});

ipcMain.on("prompts:confirm", async (event, message: string) => {
  const generatePromptState: GeneratePromptState<boolean> = (promise, resolve, tabId) => {
    return {
      // id will be overridden by the queuePrompt function
      id: "",
      type: "confirm",
      message,
      promise,
      resolver: resolve,
      tabId
    };
  };
  return processPromptRequest(event, generatePromptState, false);
});

ipcMain.on("prompts:alert", async (event, message: string) => {
  const generatePromptState: GeneratePromptState<void> = (promise, resolve, tabId) => {
    return {
      // id will be overridden by the queuePrompt function
      id: "",
      type: "alert",
      message,
      promise,
      resolver: resolve,
      tabId
    };
  };
  return processPromptRequest(event, generatePromptState, undefined);
});

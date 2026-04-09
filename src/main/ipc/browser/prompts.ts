import { tabsController } from "@/controllers/tabs-controller";
import { queuePrompt } from "@/modules/prompts";
import { ipcMain } from "electron";
import { PromptResult } from "~/types/prompts";

ipcMain.on("prompts:prompt", async (event, message: string, defaultValue: string) => {
  const { promise, resolve } = Promise.withResolvers<PromptResult<string | null>>();

  const webContents = event.sender;
  const webFrame = event.senderFrame;
  const tabId = tabsController.getTabByWebContents(webContents)?.id ?? null;
  if (!tabId || !webFrame) {
    // not a tab, return null
    event.returnValue = null;
    return;
  }

  queuePrompt(
    {
      type: "prompt",
      message,
      defaultValue,
      promise,
      resolver: resolve,
      tabId
    },
    {
      cancelOnWebFrameDetach: { webContents, webFrame }
    }
  );

  const result = await promise;
  if (result.success) {
    event.returnValue = result.result;
  } else {
    event.returnValue = null;
  }
});

ipcMain.on("prompts:confirm", async (event, message: string) => {
  // TODO: Implement confirm prompt
});

ipcMain.on("prompts:alert", async (event, message: string) => {
  // TODO: Implement alert prompt
});

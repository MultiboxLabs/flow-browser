import { tabsController } from "@/controllers/tabs-controller";
import { queuePrompt } from "@/modules/prompts";
import { ipcMain } from "electron";
import { PromptResult } from "~/types/prompts";

ipcMain.on("prompts:prompt", async (event, message: string, defaultValue: string) => {
  const { promise, resolve } = Promise.withResolvers<PromptResult<string | null>>();

  const webContents = event.sender;
  const tabId = tabsController.getTabByWebContents(webContents)?.id ?? null;
  if (!tabId) {
    // not a tab, return null
    event.returnValue = null;
    return;
  }

  queuePrompt({
    type: "prompt",
    message,
    defaultValue,
    resolver: resolve,
    tabId
  });

  const result = await promise;
  if (result.success) {
    event.returnValue = result.result;
  } else {
    event.returnValue = null;
  }
});

import { ipcMain } from "electron";

ipcMain.on("prompts:prompt", async (event, message: string, defaultValue: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  event.returnValue = "hi";
});

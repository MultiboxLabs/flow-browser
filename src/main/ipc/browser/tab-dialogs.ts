import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { ipcMain } from "electron";
import { tabDialogsController } from "@/controllers/tabs-controller/tab-dialogs-controller";
import { TabDialogResponse } from "~/types/tab-dialogs";

ipcMain.on(
  "tab-dialogs:open",
  (
    event,
    request: {
      requestId: string;
      dialogType: "alert" | "confirm" | "prompt";
      messageText: string;
      defaultPromptText: string;
    }
  ) => {
    tabDialogsController.openDialog(event.sender, request);
  }
);

ipcMain.on("tab-dialogs:wait-for-response", (event, requestId: string) => {
  event.returnValue = tabDialogsController.takeResolvedResponse(requestId);
});

ipcMain.handle("tab-dialogs:get-state", async (event) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!window) return [];

  return tabDialogsController.getStateForWindow(window.id);
});

ipcMain.handle("tab-dialogs:respond", async (_event, dialogId: string, response: TabDialogResponse) => {
  return tabDialogsController.respond(dialogId, response);
});

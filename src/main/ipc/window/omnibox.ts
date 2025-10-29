import { browserWindowsManager, windowsController } from "@/controllers/windows-controller";
import { debugPrint } from "@/modules/output";
import { ipcMain } from "electron";

ipcMain.on("omnibox:show", (event, bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
  debugPrint(
    "OMNIBOX",
    `IPC: show-omnibox received with bounds: ${JSON.stringify(bounds)} and params: ${JSON.stringify(params)}`
  );

  const parentWindow = windowsController.getWindowFromWebContents(event.sender);
  if (!parentWindow) {
    debugPrint("OMNIBOX", "Parent window not found");
    return;
  }
  if (!browserWindowsManager.isInstanceOf(parentWindow)) {
    debugPrint("OMNIBOX", "Parent window is not a BrowserWindow");
    return;
  }

  const omnibox = parentWindow.omnibox;
  omnibox.setBounds(bounds);
  omnibox.loadInterface(params);
  omnibox.show();
});

ipcMain.on("omnibox:hide", (event) => {
  debugPrint("OMNIBOX", "IPC: hide-omnibox received");

  const parentWindow = windowsController.getWindowFromWebContents(event.sender);
  if (!parentWindow) {
    debugPrint("OMNIBOX", "Parent window not found");
    return;
  }
  if (!browserWindowsManager.isInstanceOf(parentWindow)) {
    debugPrint("OMNIBOX", "Parent window is not a BrowserWindow");
    return;
  }

  const omnibox = parentWindow.omnibox;
  omnibox.hide();
});

import { browserWindowsManager, windowsController } from "@/controllers/windows-controller";
import { debugPrint } from "@/modules/output";
import { ipcMain } from "electron";
import { OmniboxShowOptions } from "~/flow/interfaces/browser/omnibox";

ipcMain.on("omnibox:show", (event, options?: OmniboxShowOptions) => {
  debugPrint("OMNIBOX", `IPC: omnibox:show received with options: ${JSON.stringify(options)}`);

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
  omnibox.show(options);
});

ipcMain.on("omnibox:hide", (event) => {
  debugPrint("OMNIBOX", "IPC: omnibox:hide received");

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

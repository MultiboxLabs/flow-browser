import { setOmniboxBounds, loadOmnibox, showOmnibox, hideOmnibox } from "@/browser/components/omnibox";
import { debugPrint } from "@/modules/output";
import { BrowserWindow, ipcMain } from "electron";

ipcMain.on("omnibox:show", (event, bounds: Electron.Rectangle | null, params: { [key: string]: string } | null) => {
  debugPrint(
    "OMNIBOX",
    `IPC: show-omnibox received with bounds: ${JSON.stringify(bounds)} and params: ${JSON.stringify(params)}`
  );
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  if (!parentWindow) {
    debugPrint("OMNIBOX", "Parent window not found");
    return;
  }
  setOmniboxBounds(parentWindow, bounds);
  loadOmnibox(parentWindow, params);
  showOmnibox(parentWindow);
});

ipcMain.on("omnibox:hide", (event) => {
  debugPrint("OMNIBOX", "IPC: hide-omnibox received");
  const parentWindow = BrowserWindow.fromWebContents(event.sender);
  if (!parentWindow) {
    debugPrint("OMNIBOX", "Parent window not found");
    return;
  }
  hideOmnibox(parentWindow);
});

import { BaseWindow } from "@/controllers/windows-controller/types/base";
import { BrowserWindow } from "electron";

export class ExtensionPopupWindow extends BaseWindow {
  constructor(browserWindow: BrowserWindow) {
    // Uses the browserWindow that was already created by the extension handler
    super("extension-popup", browserWindow);
  }
}

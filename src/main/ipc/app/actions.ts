import { BrowserWindow } from "@/controllers/windows-controller/types";
import { sendMessageToListeners } from "@/ipc/listeners-manager";

export async function fireCopyLinkAction(win: BrowserWindow) {
  win.sendMessage("actions:on-copy-link");
}

export async function fireFrontendAction(action: string) {
  sendMessageToListeners("actions:on-incoming", action);
}

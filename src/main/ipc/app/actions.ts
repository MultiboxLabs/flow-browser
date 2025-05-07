import { TabbedBrowserWindow } from "@/browser/window";
import { sendMessageToListeners, sendMessageToListenersInWindow } from "@/ipc/listeners-manager";

export async function fireCopyLinkAction(win: TabbedBrowserWindow) {
  sendMessageToListenersInWindow(win, "actions:on-copy-link");
}

export async function fireFrontendAction(action: string) {
  sendMessageToListeners("actions:on-incoming", action);
}

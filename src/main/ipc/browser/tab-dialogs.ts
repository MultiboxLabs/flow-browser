import { ipcMain } from "electron";
import { tabsController } from "@/controllers/tabs-controller";
import { TabDialogResult, TabDialogType } from "~/types/tab-dialogs";

let dialogCounter = 0;

function generateDialogId(): string {
  return `dlg-${Date.now()}-${dialogCounter++}`;
}

function getDefaultResult(type: TabDialogType): TabDialogResult {
  switch (type) {
    case "alert":
      return { type: "alert" };
    case "confirm":
      return { type: "confirm", confirmed: false };
    case "prompt":
      return { type: "prompt", value: null };
  }
}

ipcMain.on("tab-dialogs:show", (event, payload: { type: TabDialogType; message: string; defaultValue?: string }) => {
  const tab = tabsController.getTabByWebContents(event.sender);
  if (!tab) {
    event.returnValue = getDefaultResult(payload.type);
    return;
  }

  const window = tab.getWindow();
  if (!window) {
    event.returnValue = getDefaultResult(payload.type);
    return;
  }

  const dialogId = generateDialogId();

  // Hide the tab's WebContentsView so the dialog rendered in the
  // browser chrome (behind the tab) becomes visible.
  if (tab.view) {
    tab.view.setVisible(false);
  }

  window.sendMessageToCoreWebContents("tab-dialogs:on-show", {
    dialogId,
    tabId: tab.id,
    type: payload.type,
    message: payload.message,
    defaultValue: payload.defaultValue
  });

  const responseChannel = `tab-dialogs:respond:${dialogId}`;
  let settled = false;

  const settle = (result: TabDialogResult) => {
    if (settled) return;
    settled = true;

    // Re-show the tab's WebContentsView
    if (tab.view && !tab.isDestroyed) {
      tab.view.setVisible(true);
    }

    event.returnValue = result;
    cleanup();
  };

  const onResponse = (_e: Electron.IpcMainEvent, result: TabDialogResult) => {
    settle(result);
  };

  const onTabDestroyed = () => {
    settle(getDefaultResult(payload.type));
  };

  const cleanup = () => {
    ipcMain.removeListener(responseChannel, onResponse);
    tab.off("destroyed", onTabDestroyed);
  };

  ipcMain.once(responseChannel, onResponse);
  tab.once("destroyed", onTabDestroyed);
});

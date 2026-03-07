import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { tabsController } from "@/controllers/tabs-controller";
import { generateID } from "@/modules/utils";
import { WebContents } from "electron";
import { TabDialogResponse, TabDialogState, TabDialogType } from "~/types/tab-dialogs";

interface OpenTabDialogRequest {
  requestId: string;
  dialogType: TabDialogType;
  messageText: string;
  defaultPromptText: string;
}

interface PendingDialogEntry {
  state: TabDialogState;
  requestId: string;
  webContentsId: number;
}

interface ResolvedDialogResponse {
  done: true;
  accept: boolean;
  promptText: string;
}

class TabDialogsController {
  private pendingDialogs = new Map<string, PendingDialogEntry>();
  private resolvedResponses = new Map<string, ResolvedDialogResponse>();
  private webContentsDestroyHandlers = new Map<number, () => void>();

  public openDialog(webContents: WebContents, request: OpenTabDialogRequest): void {
    this.ensureWebContentsCleanup(webContents);

    const tab = tabsController.getTabByWebContents(webContents);
    if (!tab) {
      this.resolvedResponses.set(request.requestId, {
        done: true,
        accept: request.dialogType === "alert",
        promptText: ""
      });
      return;
    }

    const dialogId = generateID();
    this.pendingDialogs.set(dialogId, {
      state: {
        id: dialogId,
        tabId: tab.id,
        type: request.dialogType,
        messageText: request.messageText,
        defaultPromptText: request.defaultPromptText
      },
      requestId: request.requestId,
      webContentsId: webContents.id
    });

    this.broadcastState(tab.getWindow().id);
  }

  public takeResolvedResponse(requestId: string): ResolvedDialogResponse | null {
    const response = this.resolvedResponses.get(requestId) ?? null;
    if (response) {
      this.resolvedResponses.delete(requestId);
    }
    return response;
  }

  public getStateForWindow(windowId: number): TabDialogState[] {
    return [...this.pendingDialogs.values()]
      .filter((entry) => {
        const tab = tabsController.getTabById(entry.state.tabId);
        return tab?.getWindow().id === windowId;
      })
      .map((entry) => entry.state);
  }

  public async respond(dialogId: string, response: TabDialogResponse): Promise<boolean> {
    const pendingDialog = this.pendingDialogs.get(dialogId);
    if (!pendingDialog) return false;

    this.pendingDialogs.delete(dialogId);

    this.resolvedResponses.set(pendingDialog.requestId, {
      done: true,
      accept: pendingDialog.state.type === "alert" ? true : response.accept,
      promptText: pendingDialog.state.type === "prompt" && response.accept ? (response.promptText ?? "") : ""
    });

    const tab = tabsController.getTabById(pendingDialog.state.tabId);
    if (tab) {
      this.broadcastState(tab.getWindow().id);
    }

    return true;
  }

  private ensureWebContentsCleanup(webContents: WebContents): void {
    if (this.webContentsDestroyHandlers.has(webContents.id)) return;

    const onDestroyed = () => {
      this.cleanupWebContents(webContents.id);
    };

    this.webContentsDestroyHandlers.set(webContents.id, onDestroyed);
    webContents.once("destroyed", onDestroyed);
  }

  private cleanupWebContents(webContentsId: number): void {
    const affectedWindowIds = new Set<number>();

    for (const [dialogId, entry] of this.pendingDialogs) {
      if (entry.webContentsId !== webContentsId) continue;

      this.pendingDialogs.delete(dialogId);
      this.resolvedResponses.set(entry.requestId, {
        done: true,
        accept: false,
        promptText: ""
      });

      const tab = tabsController.getTabById(entry.state.tabId);
      if (tab) {
        affectedWindowIds.add(tab.getWindow().id);
      }
    }

    this.webContentsDestroyHandlers.delete(webContentsId);

    for (const windowId of affectedWindowIds) {
      this.broadcastState(windowId);
    }
  }

  private broadcastState(windowId: number): void {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) return;

    window.sendMessageToCoreWebContents("tab-dialogs:on-state-changed", this.getStateForWindow(windowId));
  }
}

export const tabDialogsController = new TabDialogsController();

import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { tabsController } from "@/controllers/tabs-controller";
import { generateID } from "@/modules/utils";
import { WebContents } from "electron";
import { TabDialogResponse, TabDialogState, TabDialogType } from "~/types/tab-dialogs";

interface TabDialogRequestPayload {
  clientId: string;
  dialogType: TabDialogType;
  messageText: string;
  defaultPromptText: string;
}

interface TabDialogClient {
  id: string;
  webContents: WebContents;
  onDestroyed: () => void;
}

interface PendingDialogEntry {
  state: TabDialogState;
  clientId: string;
  resolve: (response: Response) => void;
}

const DIALOG_RESPONSE_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type"
} as const;

class TabDialogsController {
  private clients = new Map<string, TabDialogClient>();
  private clientIdsByWebContentsId = new Map<number, string>();
  private pendingDialogs = new Map<string, PendingDialogEntry>();

  public registerClient(webContents: WebContents): string {
    const existingClientId = this.clientIdsByWebContentsId.get(webContents.id);
    if (existingClientId && this.clients.has(existingClientId)) {
      return existingClientId;
    }

    const clientId = generateID();
    const client: TabDialogClient = {
      id: clientId,
      webContents,
      onDestroyed: () => {
        this.cleanupClient(clientId);
      }
    };

    this.clients.set(clientId, client);
    this.clientIdsByWebContentsId.set(webContents.id, clientId);
    webContents.once("destroyed", client.onDestroyed);
    return clientId;
  }

  public getStateForWindow(windowId: number): TabDialogState[] {
    return [...this.pendingDialogs.values()]
      .filter((entry) => {
        const tab = tabsController.getTabById(entry.state.tabId);
        return tab?.getWindow().id === windowId;
      })
      .map((entry) => entry.state);
  }

  public async handleProtocolRequest(request: Request): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: DIALOG_RESPONSE_HEADERS
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: DIALOG_RESPONSE_HEADERS
      });
    }

    let payload: TabDialogRequestPayload | null = null;
    try {
      payload = (JSON.parse(await request.text()) as TabDialogRequestPayload) ?? null;
    } catch {
      return this.createResolvedResponse(false, "");
    }

    if (!payload) {
      return this.createResolvedResponse(false, "");
    }

    const client = this.clients.get(payload.clientId);
    if (!client || client.webContents.isDestroyed()) {
      return this.createResolvedResponse(payload.dialogType === "alert", "");
    }

    const tab = tabsController.getTabByWebContents(client.webContents);
    if (!tab) {
      return this.createResolvedResponse(payload.dialogType === "alert", "");
    }

    const dialogId = generateID();
    const state: TabDialogState = {
      id: dialogId,
      tabId: tab.id,
      type: payload.dialogType,
      messageText: payload.messageText,
      defaultPromptText: payload.defaultPromptText
    };

    return new Promise<Response>((resolve) => {
      this.pendingDialogs.set(dialogId, {
        state,
        clientId: client.id,
        resolve
      });

      this.broadcastState(tab.getWindow().id);
    });
  }

  public async respond(dialogId: string, response: TabDialogResponse): Promise<boolean> {
    const pendingDialog = this.pendingDialogs.get(dialogId);
    if (!pendingDialog) return false;

    const dialog = pendingDialog.state;
    const accept = dialog.type === "alert" ? true : response.accept;
    const promptText = dialog.type === "prompt" && accept ? (response.promptText ?? "") : "";

    pendingDialog.resolve(this.createResolvedResponse(accept, promptText));
    this.pendingDialogs.delete(dialogId);

    const tab = tabsController.getTabById(dialog.tabId);
    if (tab) {
      this.broadcastState(tab.getWindow().id);
    }

    return true;
  }

  private cleanupClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    this.clients.delete(clientId);
    this.clientIdsByWebContentsId.delete(client.webContents.id);

    if (!client.webContents.isDestroyed()) {
      client.webContents.removeListener("destroyed", client.onDestroyed);
    }

    const affectedWindowIds = new Set<number>();
    for (const [dialogId, entry] of this.pendingDialogs) {
      if (entry.clientId !== clientId) continue;

      entry.resolve(this.createResolvedResponse(false, ""));
      this.pendingDialogs.delete(dialogId);

      const tab = tabsController.getTabById(entry.state.tabId);
      if (tab) {
        affectedWindowIds.add(tab.getWindow().id);
      }
    }

    for (const windowId of affectedWindowIds) {
      this.broadcastState(windowId);
    }
  }

  private createResolvedResponse(accept: boolean, promptText: string): Response {
    return new Response(
      JSON.stringify({
        accept,
        promptText
      }),
      {
        status: 200,
        headers: DIALOG_RESPONSE_HEADERS
      }
    );
  }

  private broadcastState(windowId: number): void {
    const window = browserWindowsController.getWindowById(windowId);
    if (!window) return;

    window.sendMessageToCoreWebContents("tab-dialogs:on-state-changed", this.getStateForWindow(windowId));
  }
}

export const tabDialogsController = new TabDialogsController();

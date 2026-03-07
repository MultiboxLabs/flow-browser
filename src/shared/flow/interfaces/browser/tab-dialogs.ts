import { IPCListener } from "~/flow/types";
import { TabDialogResponse, TabDialogState } from "~/types/tab-dialogs";

export interface FlowTabDialogsAPI {
  getState: () => Promise<TabDialogState[]>;
  onStateChanged: IPCListener<[TabDialogState[]]>;
  respond: (dialogId: string, response: TabDialogResponse) => Promise<boolean>;
}

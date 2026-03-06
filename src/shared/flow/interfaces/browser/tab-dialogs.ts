import { IPCListener } from "~/flow/types";
import { TabDialogRequest, TabDialogResult } from "~/types/tab-dialogs";

export interface FlowTabDialogsAPI {
  onShow: IPCListener<[TabDialogRequest]>;
  respond: (dialogId: string, result: TabDialogResult) => void;
}

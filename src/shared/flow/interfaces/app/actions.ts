import { IPCListener } from "~/flow/types";

// API //
export interface FlowActionsAPI {
  /**
   * Listen for copy link action
   */
  onCopyLink: IPCListener<[]>;

  /**
   * Listen for generic incoming actions
   */
  onIncomingAction: IPCListener<[string]>;
}

export type TabDialogType = "alert" | "confirm" | "prompt";

export interface TabDialogState {
  id: string;
  tabId: number;
  type: TabDialogType;
  messageText: string;
  defaultPromptText: string;
}

export interface TabDialogResponse {
  accept: boolean;
  promptText?: string;
}

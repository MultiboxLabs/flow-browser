export type TabDialogType = "alert" | "prompt" | "confirm";

export interface TabDialogRequest {
  dialogId: string;
  tabId: number;
  type: TabDialogType;
  message: string;
  defaultValue?: string;
}

export type TabDialogResult =
  | { type: "alert" }
  | { type: "confirm"; confirmed: boolean }
  | { type: "prompt"; value: string | null };

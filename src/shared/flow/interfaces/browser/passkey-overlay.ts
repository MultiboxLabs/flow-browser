import { IPCListener } from "~/flow/types";

export interface PasskeyCredentialInfo {
  id: string; // base64url credential ID
  rpId: string;
  userName: string;
  userHandle: string;
}

export interface PasskeyOverlayPosition {
  x: number; // window-relative
  y: number;
  width: number;
  height: number;
}

export interface FlowPasskeyOverlayAPI {
  onShow: IPCListener<[{ passkeys: PasskeyCredentialInfo[]; position: PasskeyOverlayPosition }]>;
  onHide: IPCListener<[void]>;
  select: (credentialId: string) => void;
  dismiss: () => void;
}

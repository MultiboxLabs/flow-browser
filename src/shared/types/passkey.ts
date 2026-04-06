export type ConditionalPasskeyRequestState = "started" | "processing";

export interface ConditionalPasskeyRequest {
  operationId: string;
  rpId: string;
  tabId: number | null;
  state: ConditionalPasskeyRequestState;
}

export type PasskeyAuthorizationStatus = "authorized" | "denied" | "notDetermined";

export interface PasskeyCredential {
  id: string;
  rpId: string;
  userName: string;
  userHandle: string;
}

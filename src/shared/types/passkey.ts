export interface ConditionalPasskeyRequest {
  operationId: string;
  rpId: string;
  state: "starting" | "started" | "selected" | "processing" | "completed" | "cancelled";
}

export type PasskeyAuthorizationStatus = "authorized" | "denied" | "notDetermined";

export interface PasskeyCredential {
  id: string;
  rpId: string;
  userName: string;
  userHandle: string;
}

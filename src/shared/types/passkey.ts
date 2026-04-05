export interface ConditionalPasskeyRequest {
  operationId: string;
  rpId: string;
  state: "starting" | "started" | "selected" | "processing" | "completed" | "cancelled";
}

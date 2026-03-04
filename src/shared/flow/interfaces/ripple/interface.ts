import { IPCListener } from "~/flow/types";

/** Ripple agent mode. */
export type RippleMode = "browse" | "work";

/** Status of the Ripple OpenCode server. */
export type RippleStatus = "stopped" | "starting" | "running" | "error";

/** Ripple session summary (used in renderer). */
export type RippleSessionInfo = {
  id: string;
  title?: string;
  mode: RippleMode;
  tabId?: number;
  createdAt: string;
};

/** Ripple message part (mirrors OpenCode SDK Part type). */
export type RippleMessagePart =
  | { type: "text"; text: string }
  | { type: "tool-invocation"; toolName: string; args: Record<string, unknown>; result?: string; state: string }
  | { type: "step-start"; title?: string };

/** Ripple message (used in renderer). */
export type RippleMessageInfo = {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  parts: RippleMessagePart[];
  createdAt: string;
};

/**
 * Simplified Ripple IPC API.
 *
 * Session management, messages, and model selection are handled directly
 * by the OpenCode SDK client in the renderer process.
 */
export interface FlowRippleAPI {
  /** Initialize the Ripple OpenCode server. Returns the server URL or null on failure. */
  initialize: () => Promise<{ url: string } | null>;

  /** Get the current server status. */
  getStatus: () => Promise<RippleStatus>;

  /** Get the server URL (null if not running). */
  getServerUrl: () => Promise<string | null>;

  /** Toggle the Ripple sidebar visibility. */
  toggleSidebar: () => void;

  /** Listen for Ripple sidebar toggle events from the main process. */
  onToggleSidebar: IPCListener<[void]>;
}

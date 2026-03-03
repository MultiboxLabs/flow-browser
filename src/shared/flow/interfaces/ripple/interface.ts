import { IPCListener } from "~/flow/types";

/** Ripple agent mode. */
export type RippleMode = "browse" | "work";

/** Status of the Ripple OpenCode server. */
export type RippleStatus = "stopped" | "starting" | "running" | "error";

/** Ripple session summary (sent to renderer). */
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

/** Ripple message (sent to renderer). */
export type RippleMessageInfo = {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  parts: RippleMessagePart[];
  createdAt: string;
};

/** Events streamed from main process to renderer. */
export type RippleEvent =
  | { type: "status-changed"; status: RippleStatus; error?: string }
  | { type: "message-start"; sessionId: string; messageId: string; role: "assistant" }
  | { type: "message-part"; sessionId: string; messageId: string; part: RippleMessagePart }
  | { type: "message-complete"; sessionId: string; messageId: string }
  | { type: "session-updated"; session: RippleSessionInfo };

// API //
export interface FlowRippleAPI {
  /** Initialize the Ripple OpenCode server. Returns true if successful. */
  initialize: () => Promise<boolean>;

  /** Get the current server status. */
  getStatus: () => Promise<RippleStatus>;

  /** Create a new session. For browse mode, pass the tabId. */
  createSession: (mode: RippleMode, tabId?: number) => Promise<RippleSessionInfo>;

  /** Get or create a session for a specific tab (browse mode). */
  getOrCreateTabSession: (tabId: number) => Promise<RippleSessionInfo>;

  /** Send a prompt message. Returns the assistant response. */
  sendPrompt: (sessionId: string, text: string) => Promise<void>;

  /** Abort the current generation in a session. */
  abort: (sessionId: string) => Promise<boolean>;

  /** List all sessions, optionally filtered by mode. */
  getSessions: (mode?: RippleMode) => Promise<RippleSessionInfo[]>;

  /** Get messages for a session. */
  getMessages: (sessionId: string) => Promise<RippleMessageInfo[]>;

  /** Toggle filesystem access for a browse-mode session. */
  toggleFsAccess: (sessionId: string, enabled: boolean) => Promise<boolean>;

  /** Subscribe to Ripple events. */
  onEvent: IPCListener<[RippleEvent]>;

  /** Toggle the Ripple sidebar visibility. */
  toggleSidebar: () => void;

  /** Listen for Ripple sidebar toggle events from the main process. */
  onToggleSidebar: IPCListener<[void]>;
}

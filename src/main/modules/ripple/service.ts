import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";
import { startMcpBrowserServer, stopMcpBrowserServer } from "./mcp-browser-server";
import type {
  RippleMode,
  RippleStatus,
  RippleSessionInfo,
  RippleMessageInfo,
  RippleEvent,
  RippleMessagePart
} from "~/flow/interfaces/ripple/interface";

/**
 * RippleService manages the OpenCode server lifecycle and provides
 * session management for the Ripple AI agent.
 *
 * It is lazily initialized on first activation and handles:
 * - Starting/stopping the OpenCode server
 * - Starting the MCP browser tools server
 * - Creating and managing Browse/Work sessions
 * - Forwarding events to the renderer
 */
class RippleService {
  private opencode: Awaited<ReturnType<typeof createOpencode>> | null = null;
  private client: ReturnType<typeof createOpencodeClient> | null = null;
  private status: RippleStatus = "stopped";
  private statusError: string | undefined;
  private eventListeners = new Set<(event: RippleEvent) => void>();

  /** Map of tabId → sessionId for browse mode. */
  private tabSessions = new Map<number, string>();

  /** Map of sessionId → session metadata. */
  private sessions = new Map<string, RippleSessionInfo>();

  /** Set of sessions with filesystem access enabled. */
  private fsAccessSessions = new Set<string>();

  getStatus(): RippleStatus {
    return this.status;
  }

  getStatusError(): string | undefined {
    return this.statusError;
  }

  private setStatus(status: RippleStatus, error?: string) {
    this.status = status;
    this.statusError = error;
    this.emitEvent({ type: "status-changed", status, error });
  }

  /** Subscribe to Ripple events. Returns unsubscribe function. */
  onEvent(listener: (event: RippleEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private emitEvent(event: RippleEvent) {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (e) {
        console.error("[Ripple] Event listener error:", e);
      }
    }
  }

  /** Initialize the OpenCode server and MCP browser tools. */
  async initialize(): Promise<boolean> {
    if (this.status === "running") return true;
    if (this.status === "starting") return false;

    this.setStatus("starting");

    try {
      // Start MCP browser tools server first
      const mcpPort = await startMcpBrowserServer();

      // Start OpenCode server with MCP config
      this.opencode = await createOpencode({
        config: {
          mcp: {
            "flow-browser": {
              type: "remote",
              url: `http://127.0.0.1:${mcpPort}/mcp`
            }
          }
        }
      });

      this.client = this.opencode.client;
      this.setStatus("running");
      console.log("[Ripple] OpenCode server started successfully");
      return true;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("[Ripple] Failed to initialize:", errorMsg);
      this.setStatus("error", errorMsg);
      return false;
    }
  }

  /** Create a new session. */
  async createSession(mode: RippleMode, tabId?: number): Promise<RippleSessionInfo> {
    if (!this.client) throw new Error("Ripple not initialized");

    const title = mode === "browse" ? `Browse Session${tabId ? ` (Tab ${tabId})` : ""}` : "Work Session";

    const { data: session } = await this.client.session.create({
      body: { title }
    });

    if (!session) throw new Error("Failed to create session");

    const info: RippleSessionInfo = {
      id: session.id,
      title: session.title || title,
      mode,
      tabId,
      createdAt: new Date().toISOString()
    };

    this.sessions.set(session.id, info);

    if (mode === "browse" && tabId !== undefined) {
      this.tabSessions.set(tabId, session.id);
    }

    this.emitEvent({ type: "session-updated", session: info });
    return info;
  }

  /** Get or create a session for a specific tab. */
  async getOrCreateTabSession(tabId: number): Promise<RippleSessionInfo> {
    const existingSessionId = this.tabSessions.get(tabId);
    if (existingSessionId) {
      const existing = this.sessions.get(existingSessionId);
      if (existing) return existing;
    }

    return this.createSession("browse", tabId);
  }

  /** Send a prompt and stream the response. */
  async sendPrompt(sessionId: string, text: string): Promise<void> {
    if (!this.client) throw new Error("Ripple not initialized");

    try {
      const result = await this.client.session.prompt({
        path: { id: sessionId },
        body: {
          parts: [{ type: "text", text }]
        }
      });

      // The SDK returns the complete response. Emit it as parts.
      if (result.data) {
        const msg = result.data;
        const messageId = msg.info.id;

        this.emitEvent({
          type: "message-start",
          sessionId,
          messageId,
          role: "assistant"
        });

        if (msg.parts) {
          for (const part of msg.parts) {
            this.emitEvent({
              type: "message-part",
              sessionId,
              messageId,
              part: convertPart(part)
            });
          }
        }

        this.emitEvent({
          type: "message-complete",
          sessionId,
          messageId
        });
      }
    } catch (e) {
      console.error("[Ripple] Prompt error:", e);
      throw e;
    }
  }

  /** Abort the current generation. */
  async abort(sessionId: string): Promise<boolean> {
    if (!this.client) return false;

    try {
      const { data } = await this.client.session.abort({
        path: { id: sessionId }
      });
      return !!data;
    } catch {
      return false;
    }
  }

  /** List sessions, optionally filtered by mode. */
  getSessions(mode?: RippleMode): RippleSessionInfo[] {
    const all = Array.from(this.sessions.values());
    if (mode) return all.filter((s) => s.mode === mode);
    return all;
  }

  /** Get messages for a session. */
  async getMessages(sessionId: string): Promise<RippleMessageInfo[]> {
    if (!this.client) return [];

    try {
      const { data } = await this.client.session.messages({
        path: { id: sessionId }
      });

      if (!data) return [];

      return data.map((msg) => ({
        id: msg.info.id,
        sessionId,
        role: msg.info.role as "user" | "assistant",
        parts: (msg.parts || []).map(convertPart),
        createdAt: msg.info.time?.created ? new Date(msg.info.time.created).toISOString() : new Date().toISOString()
      }));
    } catch {
      return [];
    }
  }

  /** Toggle filesystem access for a browse session. */
  toggleFsAccess(sessionId: string, enabled: boolean): boolean {
    if (enabled) {
      this.fsAccessSessions.add(sessionId);
    } else {
      this.fsAccessSessions.delete(sessionId);
    }
    return true;
  }

  /** Check if a session has filesystem access. */
  hasFsAccess(sessionId: string): boolean {
    return this.fsAccessSessions.has(sessionId);
  }

  /** Shutdown everything. */
  async shutdown(): Promise<void> {
    if (this.opencode) {
      try {
        this.opencode.server.close();
      } catch {
        // ignore
      }
      this.opencode = null;
    }
    this.client = null;
    await stopMcpBrowserServer();
    this.setStatus("stopped");
  }
}

/** Convert an SDK part to our RippleMessagePart type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertPart(part: any): RippleMessagePart {
  if (part.type === "text") {
    return { type: "text", text: part.text || "" };
  }
  if (part.type === "tool") {
    return {
      type: "tool-invocation",
      toolName: part.tool || "unknown",
      args: part.state?.input || {},
      result: part.state?.output ? String(part.state.output) : undefined,
      state: part.state?.status || "pending"
    };
  }
  if (part.type === "step-start") {
    return { type: "step-start", title: part.title };
  }
  // Fallback: treat as text
  return { type: "text", text: JSON.stringify(part) };
}

/** Singleton instance. */
export const rippleService = new RippleService();

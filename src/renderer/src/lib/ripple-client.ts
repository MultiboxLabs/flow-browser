import { createOpencodeClient } from "@opencode-ai/sdk/client";
import type { RippleMessagePart, RippleMessageInfo } from "~/flow/interfaces/ripple/interface";

// ─── System Prompts ────────────────────────────────────────

const RIPPLE_BROWSE_SYSTEM_PROMPT = `You are Ripple, an AI browsing assistant built into Flow Browser. You help users interact with and understand the web page they are currently viewing.

Your capabilities:
- Read and analyze page content, links, and inputs
- Navigate to URLs, click elements, type text, and scroll
- Execute JavaScript on the page
- Take screenshots of the current page

Guidelines:
- Be concise and helpful. You're in a sidebar, so keep responses brief.
- When asked about page content, use your browser tools to read it first.
- If the user asks you to interact with the page (click, type, navigate), do so using your tools.
- Do NOT identify yourself as "opencode" or any other name. You are Ripple.
- Do NOT mention the OpenCode SDK, server, or any internal implementation details.
- Focus on the user's current browsing context and be proactive about using your tools.`;

const RIPPLE_WORK_SYSTEM_PROMPT = `You are Ripple, an AI work assistant built into Flow Browser. You help users work on their desktop, filesystem, and projects.

Your capabilities:
- Full filesystem access (read, write, search files and directories)
- Execute shell commands
- Browse and interact with web pages via browser tools

Guidelines:
- Be thorough and precise when working with files and code.
- When asked to make changes, explain what you're doing and why.
- Do NOT identify yourself as "opencode" or any other name. You are Ripple.
- Do NOT mention the OpenCode SDK, server, or any internal implementation details.
- You have full access to the user's system — use it responsibly and confirm before destructive operations.`;

export { RIPPLE_BROWSE_SYSTEM_PROMPT, RIPPLE_WORK_SYSTEM_PROMPT };

// ─── Client Singleton ──────────────────────────────────────

export type RippleClient = ReturnType<typeof createOpencodeClient>;

let client: RippleClient | null = null;
let initPromise: Promise<RippleClient | null> | null = null;

/**
 * Get or create the Ripple SDK client.
 * First call triggers server initialization via IPC.
 * Subsequent calls return the cached client.
 */
export async function getRippleClient(): Promise<RippleClient> {
  if (client) return client;

  if (!initPromise) {
    initPromise = (async () => {
      // Check if server is already running
      const serverUrl = await flow.ripple.getServerUrl();
      if (serverUrl) {
        client = createOpencodeClient({ baseUrl: serverUrl });
        return client;
      }

      // Initialize the server
      const result = await flow.ripple.initialize();
      if (!result) {
        initPromise = null;
        throw new Error("Failed to initialize Ripple server");
      }

      client = createOpencodeClient({ baseUrl: result.url });
      return client;
    })();
  }

  const result = await initPromise;
  if (!result) {
    initPromise = null;
    throw new Error("Failed to initialize Ripple client");
  }
  return result;
}

/** Reset the client (e.g. on server error for retry). */
export function resetRippleClient() {
  client = null;
  initPromise = null;
}

/** Check if the client is ready without triggering initialization. */
export function isRippleClientReady(): boolean {
  return client !== null;
}

// ─── Model Types ───────────────────────────────────────────

export type RippleModelOption = {
  providerID: string;
  providerName: string;
  modelID: string;
  modelName: string;
};

/** Fetch available models from the OpenCode server. */
export async function listAvailableModels(sdkClient: RippleClient): Promise<{
  models: RippleModelOption[];
  defaultModel: { providerID: string; modelID: string } | null;
}> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = (await sdkClient.provider.list()) as any;
  if (!data) return { models: [], defaultModel: null };

  const connectedSet = new Set<string>(data.connected || []);
  const models: RippleModelOption[] = [];

  for (const provider of data.all || []) {
    if (!connectedSet.has(provider.id)) continue;
    if (!provider.models) continue;

    for (const [modelId, modelInfo] of Object.entries(provider.models)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const info = modelInfo as any;
      models.push({
        providerID: provider.id,
        providerName: provider.name,
        modelID: modelId,
        modelName: info.name || modelId
      });
    }
  }

  let defaultModel: { providerID: string; modelID: string } | null = null;

  if (data.default) {
    const defaults = data.default as Record<string, string>;
    const defaultStr = defaults["general"] || defaults["build"] || Object.values(defaults)[0];
    if (defaultStr && typeof defaultStr === "string") {
      const slashIdx = defaultStr.indexOf("/");
      if (slashIdx > 0) {
        defaultModel = {
          providerID: defaultStr.slice(0, slashIdx),
          modelID: defaultStr.slice(slashIdx + 1)
        };
      }
    }
  }

  return { models, defaultModel };
}

// ─── SDK Part Conversion ───────────────────────────────────

/** Non-displayable part types that should be silently filtered out. */
const HIDDEN_PART_TYPES = new Set([
  "reasoning",
  "step-finish",
  "snapshot",
  "patch",
  "agent",
  "retry",
  "compaction",
  "file",
  "subtask"
]);

/**
 * Convert an SDK message part to our RippleMessagePart type.
 * Returns null for non-displayable parts (reasoning, step-finish, snapshot, etc.).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertSdkPart(part: any): RippleMessagePart | null {
  if (!part || !part.type) return null;

  if (HIDDEN_PART_TYPES.has(part.type)) return null;

  if (part.type === "text") {
    return { type: "text", text: part.text || "" };
  }
  if (part.type === "tool") {
    return {
      type: "tool-invocation",
      toolName: part.tool || "unknown",
      args: part.state?.input && typeof part.state.input === "object" ? part.state.input : {},
      result: part.state?.output ? String(part.state.output) : undefined,
      state: part.state?.status || "pending"
    };
  }
  if (part.type === "step-start") {
    return { type: "step-start", title: part.title };
  }

  // Unknown part type — silently ignore rather than dumping raw JSON
  return null;
}

/** Convert an SDK message response to our RippleMessageInfo type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertSdkMessage(msg: any, sessionId: string): RippleMessageInfo {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts = (msg.parts || []).map(convertSdkPart).filter((p: any): p is RippleMessagePart => p !== null);

  return {
    id: msg.info?.id || `msg-${Date.now()}`,
    sessionId,
    role: msg.info?.role === "user" ? "user" : "assistant",
    parts,
    createdAt: msg.info?.time?.created ? new Date(msg.info.time.created).toISOString() : new Date().toISOString()
  };
}

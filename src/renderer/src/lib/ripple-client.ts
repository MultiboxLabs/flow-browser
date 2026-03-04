import { createOpencodeClient } from "@opencode-ai/sdk/client";
import type { RippleMessagePart, RippleMessageInfo } from "~/flow/interfaces/ripple/interface";

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

/** Convert an SDK message part to our RippleMessagePart type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertSdkPart(part: any): RippleMessagePart {
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
  // Fallback
  return { type: "text", text: JSON.stringify(part) };
}

/** Convert an SDK message response to our RippleMessageInfo type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function convertSdkMessage(msg: any, sessionId: string): RippleMessageInfo {
  return {
    id: msg.info?.id || `msg-${Date.now()}`,
    sessionId,
    role: msg.info?.role === "user" ? "user" : "assistant",
    parts: (msg.parts || []).map(convertSdkPart),
    createdAt: msg.info?.time?.created ? new Date(msg.info.time.created).toISOString() : new Date().toISOString()
  };
}

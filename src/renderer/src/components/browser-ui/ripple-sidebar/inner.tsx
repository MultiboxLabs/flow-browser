import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RippleMessageInfo, RippleMessagePart } from "~/flow/interfaces/ripple/interface";
import {
  getRippleClient,
  resetRippleClient,
  listAvailableModels,
  convertSdkPart,
  convertSdkMessage,
  RIPPLE_BROWSE_SYSTEM_PROMPT,
  type RippleClient,
  type RippleModelOption
} from "@/lib/ripple-client";
import { ChatMessages } from "./_components/chat-messages";
import { ChatInput } from "./_components/chat-input";
import { ModelPicker } from "./_components/model-picker";

const BROWSE_MODEL_KEY = "ripple-browse-model";

function loadSavedModel(): { providerID: string; modelID: string } | null {
  try {
    const raw = localStorage.getItem(BROWSE_MODEL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveModel(model: { providerID: string; modelID: string }) {
  localStorage.setItem(BROWSE_MODEL_KEY, JSON.stringify(model));
}

/**
 * RippleSidebarInner
 *
 * Browse Mode sidebar. Uses the OpenCode SDK client directly in the renderer.
 * One session per tab, tracked in a ref map.
 * Uses promptAsync + event.subscribe for real-time streaming.
 */
export function RippleSidebarInner() {
  const tabId = useFocusedTabId();

  // Server status
  const [status, setStatus] = useState<"stopped" | "starting" | "running" | "error">("stopped");
  const [isInitializing, setIsInitializing] = useState(false);

  // SDK client ref
  const clientRef = useRef<RippleClient | null>(null);

  // Tab → session ID mapping (persists across re-renders)
  const tabSessionMap = useRef<Map<number, string>>(new Map());

  // Current session for active tab
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<RippleMessageInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Streaming state: accumulated parts by messageID → partID → Part
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamingPartsRef = useRef<Map<string, Map<string, any>>>(new Map());
  // Track message roles from message.updated events
  const messageRolesRef = useRef<Map<string, "user" | "assistant">>(new Map());

  // Model selection
  const [models, setModels] = useState<RippleModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ providerID: string; modelID: string } | null>(loadSavedModel());
  const [modelsLoading, setModelsLoading] = useState(false);

  // Event subscription abort controller
  const eventAbortRef = useRef<AbortController | null>(null);

  // Keep sessionIdRef in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Initialize the OpenCode server + SDK client on first render
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const currentStatus = await flow.ripple.getStatus();
        if (!cancelled) setStatus(currentStatus);

        if (currentStatus === "running") {
          const sdkClient = await getRippleClient();
          if (!cancelled) {
            clientRef.current = sdkClient;
            setStatus("running");
          }
          return;
        }

        setIsInitializing(true);
        const sdkClient = await getRippleClient();
        if (!cancelled) {
          clientRef.current = sdkClient;
          setStatus("running");
          setIsInitializing(false);
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setIsInitializing(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Load available models once running
  useEffect(() => {
    if (status !== "running" || !clientRef.current) return;

    let cancelled = false;
    setModelsLoading(true);

    listAvailableModels(clientRef.current)
      .then(({ models: availableModels, defaultModel }) => {
        if (cancelled) return;
        setModels(availableModels);
        setModelsLoading(false);

        // If no model selected yet, use the default
        if (!selectedModel && defaultModel) {
          setSelectedModel(defaultModel);
          saveModel(defaultModel);
        }
      })
      .catch(() => {
        if (!cancelled) setModelsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Subscribe to SSE events for streaming when client is ready
  useEffect(() => {
    if (status !== "running" || !clientRef.current) return;

    const client = clientRef.current;
    const abortController = new AbortController();
    eventAbortRef.current = abortController;

    async function listenForEvents() {
      try {
        const { stream } = await client.event.subscribe({
          signal: abortController.signal
        });

        for await (const event of stream) {
          if (abortController.signal.aborted) break;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const evt = event as any;
          if (!evt || !evt.type) continue;

          const currentSessionId = sessionIdRef.current;
          if (!currentSessionId) continue;

          if (evt.type === "message.updated") {
            const msg = evt.properties?.info;
            if (!msg || msg.sessionID !== currentSessionId) continue;

            // Track role for this message
            messageRolesRef.current.set(msg.id, msg.role);

            // If it's an assistant message, ensure we have it in our messages list
            if (msg.role === "assistant") {
              setMessages((prev) => {
                const exists = prev.some((m) => m.id === msg.id);
                if (!exists) {
                  return [
                    ...prev,
                    {
                      id: msg.id,
                      sessionId: currentSessionId,
                      role: "assistant",
                      parts: [],
                      createdAt: msg.time?.created ? new Date(msg.time.created).toISOString() : new Date().toISOString()
                    }
                  ];
                }
                return prev;
              });
            }
          } else if (evt.type === "message.part.updated") {
            const part = evt.properties?.part;
            if (!part || part.sessionID !== currentSessionId) continue;

            // Skip user message parts (we have optimistic user messages)
            const role = messageRolesRef.current.get(part.messageID);
            if (role === "user") continue;

            // Accumulate parts
            if (!streamingPartsRef.current.has(part.messageID)) {
              streamingPartsRef.current.set(part.messageID, new Map());
            }
            streamingPartsRef.current.get(part.messageID)!.set(part.id, part);

            // Convert accumulated parts to RippleMessageParts and update state
            const partsMap = streamingPartsRef.current.get(part.messageID)!;
            const convertedParts: RippleMessagePart[] = [];
            for (const p of partsMap.values()) {
              const converted = convertSdkPart(p);
              if (converted) convertedParts.push(converted);
            }

            setMessages((prev) => prev.map((m) => (m.id === part.messageID ? { ...m, parts: convertedParts } : m)));
          } else if (evt.type === "session.idle") {
            const sid = evt.properties?.sessionID;
            if (sid === currentSessionId) {
              setIsStreaming(false);
              // Clear streaming parts for this session's messages
              streamingPartsRef.current.clear();
            }
          }
        }
      } catch (e) {
        // AbortError is expected on cleanup
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("[Ripple Browse] Event stream error:", e);
      }
    }

    listenForEvents();

    return () => {
      abortController.abort();
      eventAbortRef.current = null;
    };
  }, [status]);

  // Get or create session when tab changes
  useEffect(() => {
    if (status !== "running" || tabId == null || !clientRef.current) return;

    let cancelled = false;
    const client = clientRef.current;

    async function loadSession() {
      // Check if we already have a session for this tab
      const existingSessionId = tabSessionMap.current.get(tabId!);

      if (existingSessionId) {
        setSessionId(existingSessionId);

        // Load messages for existing session
        try {
          const { data } = await client.session.messages({ path: { id: existingSessionId } });
          if (!cancelled && data) {
            const converted = data.map((msg: unknown) => convertSdkMessage(msg, existingSessionId));
            setMessages(converted);
          }
        } catch {
          if (!cancelled) setMessages([]);
        }
        return;
      }

      // Create a new session for this tab
      try {
        const { data } = await client.session.create({
          body: { title: `Browse — Tab ${tabId}` }
        });
        if (cancelled || !data) return;

        const newSessionId = data.id;
        tabSessionMap.current.set(tabId!, newSessionId);
        setSessionId(newSessionId);
        setMessages([]);
      } catch (e) {
        console.error("[Ripple] Failed to create session:", e);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [status, tabId]);

  // Handle model change
  const handleSelectModel = useCallback((model: { providerID: string; modelID: string }) => {
    setSelectedModel(model);
    saveModel(model);
  }, []);

  // Send prompt using promptAsync (fire-and-forget, streaming via events)
  const handleSend = useCallback(
    async (text: string) => {
      if (!clientRef.current || !sessionId) return;

      const client = clientRef.current;

      // Optimistically add user message
      const userMsg: RippleMessageInfo = {
        id: `user-${Date.now()}`,
        sessionId,
        role: "user",
        parts: [{ type: "text", text }],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      // Clear any stale streaming parts
      streamingPartsRef.current.clear();

      try {
        await client.session.promptAsync({
          path: { id: sessionId },
          body: {
            parts: [{ type: "text", text }],
            system: RIPPLE_BROWSE_SYSTEM_PROMPT,
            agent: "browse",
            ...(selectedModel
              ? { model: { providerID: selectedModel.providerID, modelID: selectedModel.modelID } }
              : {})
          }
        });
        // Response is 204 — streaming happens via event.subscribe
      } catch (e) {
        console.error("[Ripple] Send prompt error:", e);
        setIsStreaming(false);
      }
    },
    [sessionId, selectedModel]
  );

  // Abort generation
  const handleAbort = useCallback(async () => {
    if (!clientRef.current || !sessionId) return;

    try {
      await clientRef.current.session.abort({ path: { id: sessionId } });
    } catch {
      // ignore
    }
    setIsStreaming(false);

    // Reload messages to get final state
    try {
      const { data } = await clientRef.current.session.messages({ path: { id: sessionId } });
      if (data) {
        setMessages(data.map((msg: unknown) => convertSdkMessage(msg, sessionId)));
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Render states
  if (status === "stopped" || isInitializing) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-4">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
        <div className="text-xs text-white/40">Starting Ripple...</div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 px-4">
        <div className="text-red-400 text-sm">Failed to start Ripple</div>
        <div className="text-xs text-white/30 text-center">Make sure OpenCode is installed on your system.</div>
        <button
          type="button"
          onClick={async () => {
            setIsInitializing(true);
            setStatus("starting");
            resetRippleClient();
            try {
              const sdkClient = await getRippleClient();
              clientRef.current = sdkClient;
              setStatus("running");
            } catch {
              setStatus("error");
            }
            setIsInitializing(false);
          }}
          className="mt-2 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/15 text-white/70 rounded-md transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-medium text-white/80">Ripple</span>
      </div>

      {/* Model Picker */}
      <div className="shrink-0 px-3 py-2 border-b border-white/5">
        <ModelPicker
          models={models}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          isLoading={modelsLoading}
          compact
        />
      </div>

      {/* Messages */}
      <ChatMessages messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isStreaming={isStreaming}
        disabled={status !== "running" || !sessionId}
      />
    </div>
  );
}

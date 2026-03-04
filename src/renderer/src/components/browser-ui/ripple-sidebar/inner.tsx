import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RippleMessageInfo, RippleStatus } from "~/flow/interfaces/ripple/interface";
import {
  getRippleClient,
  resetRippleClient,
  listAvailableModels,
  convertSdkMessage,
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
 */
export function RippleSidebarInner() {
  const tabId = useFocusedTabId();

  // Server status
  const [status, setStatus] = useState<RippleStatus>("stopped");
  const [isInitializing, setIsInitializing] = useState(false);

  // SDK client ref
  const clientRef = useRef<RippleClient | null>(null);

  // Tab → session ID mapping (persists across re-renders)
  const tabSessionMap = useRef<Map<number, string>>(new Map());

  // Current session for active tab
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RippleMessageInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Model selection
  const [models, setModels] = useState<RippleModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ providerID: string; modelID: string } | null>(loadSavedModel());
  const [modelsLoading, setModelsLoading] = useState(false);

  // Initialize the OpenCode server + SDK client on first render
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const currentStatus = await flow.ripple.getStatus();
        if (!cancelled) setStatus(currentStatus);

        if (currentStatus === "running") {
          // Server already running, just create client
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

  // Send prompt
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

      try {
        await client.session.prompt({
          path: { id: sessionId },
          body: {
            parts: [{ type: "text", text }],
            ...(selectedModel
              ? { model: { providerID: selectedModel.providerID, modelID: selectedModel.modelID } }
              : {})
          }
        });

        // Prompt returns the full message list or the assistant response.
        // After prompt completes, reload all messages to get the final state.
        const { data: allMessages } = await client.session.messages({ path: { id: sessionId } });
        if (allMessages) {
          setMessages(allMessages.map((msg: unknown) => convertSdkMessage(msg, sessionId)));
        }
      } catch (e) {
        console.error("[Ripple] Send prompt error:", e);
      } finally {
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

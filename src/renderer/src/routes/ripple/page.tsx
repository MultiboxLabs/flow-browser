import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type { RippleMessageInfo, RippleMessagePart, RippleStatus } from "~/flow/interfaces/ripple/interface";
import {
  getRippleClient,
  resetRippleClient,
  listAvailableModels,
  convertSdkMessage,
  type RippleClient,
  type RippleModelOption
} from "@/lib/ripple-client";
import { ModelPicker } from "@/components/browser-ui/ripple-sidebar/_components/model-picker";

const WORK_MODEL_KEY = "ripple-work-model";

function loadSavedModel(): { providerID: string; modelID: string } | null {
  try {
    const raw = localStorage.getItem(WORK_MODEL_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveModel(model: { providerID: string; modelID: string }) {
  localStorage.setItem(WORK_MODEL_KEY, JSON.stringify(model));
}

/** Session info as returned by client.session.list() */
type SessionListItem = {
  id: string;
  title?: string;
  createdAt?: string;
  time?: { created?: number };
};

/**
 * Work Mode page — flow://ripple
 *
 * Full-page chat interface with session list sidebar.
 * Uses the OpenCode SDK client directly in the renderer.
 */
function Page() {
  // Server status
  const [status, setStatus] = useState<RippleStatus>("stopped");
  const [isInitializing, setIsInitializing] = useState(false);

  // SDK client ref
  const clientRef = useRef<RippleClient | null>(null);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<RippleMessageInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Session list
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);

  // Model selection
  const [models, setModels] = useState<RippleModelOption[]>([]);
  const [selectedModel, setSelectedModel] = useState<{ providerID: string; modelID: string } | null>(loadSavedModel());
  const [modelsLoading, setModelsLoading] = useState(false);

  // Auto-scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Initialize OpenCode server + SDK client
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

  // Load available models + session list once running
  useEffect(() => {
    if (status !== "running" || !clientRef.current) return;

    let cancelled = false;
    const client = clientRef.current;

    // Load models
    setModelsLoading(true);
    listAvailableModels(client)
      .then(({ models: availableModels, defaultModel }) => {
        if (cancelled) return;
        setModels(availableModels);
        setModelsLoading(false);

        if (!selectedModel && defaultModel) {
          setSelectedModel(defaultModel);
          saveModel(defaultModel);
        }
      })
      .catch(() => {
        if (!cancelled) setModelsLoading(false);
      });

    // Load session list
    client.session
      .list()
      .then(({ data }: { data?: unknown }) => {
        if (cancelled || !data) return;
        // data is an array of session objects
        const sessionList = data as SessionListItem[];
        setSessions(sessionList);
      })
      .catch(() => {
        // ignore
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // Auto-scroll on new messages
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isAtBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 40;
  };

  // Handle model change
  const handleSelectModel = useCallback((model: { providerID: string; modelID: string }) => {
    setSelectedModel(model);
    saveModel(model);
  }, []);

  // Create a new work session
  const handleNewSession = useCallback(async () => {
    if (status !== "running" || !clientRef.current) return;

    try {
      const { data } = await clientRef.current.session.create({
        body: { title: "Work Session" }
      });
      if (!data) return;

      setSessionId(data.id);
      setMessages([]);

      // Add to session list
      setSessions((prev) => [{ id: data.id, title: "Work Session", time: { created: Date.now() } }, ...prev]);
    } catch (e) {
      console.error("[Ripple Work] Failed to create session:", e);
    }
  }, [status]);

  // Select an existing session
  const handleSelectSession = useCallback(async (sid: string) => {
    if (!clientRef.current) return;

    setSessionId(sid);

    try {
      const { data } = await clientRef.current.session.messages({ path: { id: sid } });
      if (data) {
        setMessages(data.map((msg: unknown) => convertSdkMessage(msg, sid)));
      } else {
        setMessages([]);
      }
    } catch {
      setMessages([]);
    }
  }, []);

  // Send a prompt
  const handleSend = useCallback(
    async (text: string) => {
      if (!clientRef.current) return;

      const client = clientRef.current;
      let activeSessionId = sessionId;

      // Auto-create a session if none exists
      if (!activeSessionId) {
        try {
          const { data } = await client.session.create({
            body: { title: "Work Session" }
          });
          if (!data) return;

          activeSessionId = data.id;
          setSessionId(activeSessionId);
          setSessions((prev) => [
            { id: activeSessionId!, title: "Work Session", time: { created: Date.now() } },
            ...prev
          ]);
        } catch (e) {
          console.error("[Ripple Work] Failed to create session:", e);
          return;
        }
      }

      // Optimistically add user message
      const userMsg: RippleMessageInfo = {
        id: `user-${Date.now()}`,
        sessionId: activeSessionId,
        role: "user",
        parts: [{ type: "text", text }],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        await client.session.prompt({
          path: { id: activeSessionId },
          body: {
            parts: [{ type: "text", text }],
            ...(selectedModel
              ? { model: { providerID: selectedModel.providerID, modelID: selectedModel.modelID } }
              : {})
          }
        });

        // Reload all messages to get final state
        const { data: allMessages } = await client.session.messages({ path: { id: activeSessionId } });
        if (allMessages) {
          setMessages(allMessages.map((msg: unknown) => convertSdkMessage(msg, activeSessionId!)));
        }
      } catch (e) {
        console.error("[Ripple Work] Send prompt error:", e);
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

    // Reload messages
    try {
      const { data } = await clientRef.current.session.messages({ path: { id: sessionId } });
      if (data) {
        setMessages(data.map((msg: unknown) => convertSdkMessage(msg, sessionId)));
      }
    } catch {
      // ignore
    }
  }, [sessionId]);

  // Loading state
  if (status === "stopped" || isInitializing) {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          <div className="text-sm text-white/40">Starting Ripple...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-red-400 text-base font-medium">Failed to start Ripple</div>
          <div className="text-sm text-white/30 text-center max-w-sm">
            Make sure OpenCode is installed on your system and accessible in your PATH.
          </div>
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
            className="mt-2 px-4 py-2 text-sm bg-white/10 hover:bg-white/15 text-white/70 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen bg-background flex">
      {/* Session sidebar */}
      {showSidebar && (
        <div className="w-64 shrink-0 border-r border-white/10 flex flex-col bg-white/[0.02]">
          {/* Sidebar header */}
          <div className="shrink-0 flex items-center justify-between px-3 py-3 border-b border-white/10">
            <span className="text-sm font-medium text-white/70">Sessions</span>
            <button
              type="button"
              onClick={handleNewSession}
              className="size-6 rounded flex items-center justify-center text-white/40 hover:text-white/70 hover:bg-white/10 transition-colors"
              title="New session"
            >
              <PlusIcon />
            </button>
          </div>

          {/* Session list */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-white/20">
                No sessions yet. Start a conversation below.
              </div>
            ) : (
              <div className="py-1">
                {sessions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSession(s.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm transition-colors",
                      "hover:bg-white/5",
                      sessionId === s.id ? "bg-white/10 text-white/90" : "text-white/50"
                    )}
                  >
                    <div className="truncate">{s.title || "Untitled session"}</div>
                    <div className="text-[10px] text-white/25 mt-0.5">
                      {formatTimestamp(s.time?.created, s.createdAt)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/10">
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className={cn(
              "size-7 rounded flex items-center justify-center transition-colors",
              showSidebar ? "bg-white/10 text-white/70" : "text-white/40 hover:text-white/70 hover:bg-white/10"
            )}
            title={showSidebar ? "Hide sessions" : "Show sessions"}
          >
            <SidebarIcon />
          </button>
          <span className="text-sm font-medium text-white/80">Ripple</span>
          <span className="text-xs text-white/30">Work Mode</span>

          {/* Model picker in header */}
          <div className="ml-auto w-56">
            <ModelPicker
              models={models}
              selectedModel={selectedModel}
              onSelectModel={handleSelectModel}
              isLoading={modelsLoading}
              compact
            />
          </div>
        </div>

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center max-w-md">
              <div className="text-white/40 text-lg font-medium mb-2">Ripple Work Mode</div>
              <div className="text-white/25 text-sm leading-relaxed">
                Work on your desktop and filesystem. Ripple has full access to files, shell commands, and browser tools.
              </div>
            </div>
          </div>
        ) : (
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto" onScroll={handleScroll}>
            <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col gap-4">
              {messages.map((msg) => (
                <WorkMessage key={msg.id} message={msg} />
              ))}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-lg px-3 py-2 rounded-bl-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <WorkChatInput
          onSend={handleSend}
          onAbort={handleAbort}
          isStreaming={isStreaming}
          disabled={status !== "running"}
        />
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

/** Work mode message — wider layout than Browse mode sidebar */
function WorkMessage({ message }: { message: RippleMessageInfo }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3 text-sm",
          isUser ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"
        )}
      >
        {message.parts.map((part, i) => (
          <WorkMessagePart key={i} part={part} />
        ))}
      </div>
    </div>
  );
}

function WorkMessagePart({ part }: { part: RippleMessagePart }) {
  switch (part.type) {
    case "text":
      return <WorkTextContent text={part.text} />;
    case "tool-invocation":
      return <WorkToolCall toolName={part.toolName} args={part.args} result={part.result} state={part.state} />;
    case "step-start":
      return part.title ? <div className="text-white/40 text-xs italic py-1">{part.title}</div> : null;
    default:
      return null;
  }
}

function WorkTextContent({ text }: { text: string }) {
  if (!text) return null;

  const lines = text.split("\n");
  return (
    <div className="whitespace-pre-wrap break-words leading-relaxed">
      {lines.map((line, i) => (
        <span key={i}>
          {line}
          {i < lines.length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}

const TOOL_LABELS: Record<string, string> = {
  // Browser tools
  get_page_content: "Read page content",
  get_page_url: "Get page URL",
  get_page_title: "Get page title",
  navigate: "Navigate",
  go_back: "Go back",
  go_forward: "Go forward",
  click_element: "Click element",
  type_text: "Type text",
  scroll_page: "Scroll page",
  evaluate_js: "Execute JavaScript",
  screenshot: "Take screenshot",
  get_page_links: "Get page links",
  get_page_inputs: "Get page inputs",
  // Common filesystem/shell tools
  read_file: "Read file",
  write_file: "Write file",
  list_directory: "List directory",
  execute_command: "Run command",
  search_files: "Search files"
};

function WorkToolCall({
  toolName,
  args,
  result,
  state
}: {
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  state: string;
}) {
  const [isExpanded, setExpanded] = useState(false);
  const label = TOOL_LABELS[toolName] || toolName;

  const isRunning = state === "running" || state === "pending";
  const isError = state === "error";

  return (
    <div className="my-2 rounded-md border border-white/10 bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left"
      >
        <span
          className={cn(
            "shrink-0",
            isRunning && "text-yellow-400 animate-pulse",
            isError && "text-red-400",
            !isRunning && !isError && "text-green-400"
          )}
        >
          {isRunning ? "\u25CF" : isError ? "\u2717" : "\u2713"}
        </span>
        <span className="text-white/70 truncate flex-1">{label}</span>
        <span className="text-white/30 shrink-0">{isExpanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-2.5 border-t border-white/5">
          {Object.keys(args).length > 0 && (
            <div className="mt-2">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Args</div>
              <pre className="text-[11px] text-white/50 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className="mt-2">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Result</div>
              <pre className="text-[11px] text-white/50 overflow-x-auto max-h-48 whitespace-pre-wrap break-all">
                {result.length > 1000 ? result.slice(0, 1000) + "..." : result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Chat input for Work Mode — wider with more breathing room */
function WorkChatInput({
  onSend,
  onAbort,
  isStreaming,
  disabled
}: {
  onSend: (text: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled: boolean;
}) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [text, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  return (
    <div className="shrink-0 border-t border-white/10">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex items-end gap-2 bg-white/5 rounded-lg border border-white/10 p-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Ask Ripple anything..."
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30",
              "resize-none outline-none min-h-[32px] max-h-[200px] py-1.5 px-2",
              "leading-snug",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          />
          {isStreaming ? (
            <button
              type="button"
              onClick={onAbort}
              className="shrink-0 size-8 rounded-md flex items-center justify-center bg-red-500/80 hover:bg-red-500 text-white transition-colors"
              title="Stop generating"
            >
              {"\u25A0"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || disabled}
              className={cn(
                "shrink-0 size-8 rounded-md flex items-center justify-center",
                "bg-blue-600/80 hover:bg-blue-600 text-white transition-colors",
                (!text.trim() || disabled) && "opacity-30 cursor-not-allowed"
              )}
              title="Send message"
            >
              {"\u2191"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ───────────────────────────────────────────────────────

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function SidebarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="3" x2="9" y2="21" />
    </svg>
  );
}

// ─── Utilities ───────────────────────────────────────────────────

function formatTimestamp(epochMs?: number, isoString?: string): string {
  try {
    const date = epochMs ? new Date(epochMs) : isoString ? new Date(isoString) : null;
    if (!date) return "";

    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60_000) return "Just now";
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

// ─── App ─────────────────────────────────────────────────────────

/** Gate component that checks whether Ripple is enabled in settings. */
function RippleGate() {
  const [enabledState, setEnabledState] = useState<"loading" | "enabled" | "disabled">("loading");

  useEffect(() => {
    let cancelled = false;

    async function checkEnabled() {
      try {
        const value = await flow.settings.getSetting("rippleEnabled");
        if (!cancelled) setEnabledState(value === true ? "enabled" : "disabled");
      } catch {
        if (!cancelled) setEnabledState("disabled");
      }
    }

    checkEnabled();

    // Re-check when settings change
    const unsub = flow.settings.onSettingsChanged(() => {
      checkEnabled();
    });

    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  if (enabledState === "loading") {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (enabledState === "disabled") {
    return (
      <div className="w-screen h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center">
          <div className="text-white/50 text-lg font-medium">Ripple is disabled</div>
          <div className="text-sm text-white/30 leading-relaxed">
            Enable Ripple in Settings to use Work Mode. Go to Settings &gt; Ripple and toggle the switch.
          </div>
        </div>
      </div>
    );
  }

  return <Page />;
}

function App() {
  return (
    <>
      <title>Ripple — Work Mode</title>
      <RippleGate />
    </>
  );
}
export default App;

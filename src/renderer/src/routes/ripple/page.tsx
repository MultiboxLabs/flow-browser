import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RippleMessageInfo,
  RippleSessionInfo,
  RippleEvent,
  RippleMessagePart,
  RippleStatus
} from "~/flow/interfaces/ripple/interface";

/**
 * Work Mode page — flow://ripple
 *
 * Full-page chat interface with session list sidebar.
 * Has full filesystem + browser access by default.
 */
function Page() {
  // Server status
  const [status, setStatus] = useState<RippleStatus>("stopped");
  const [isInitializing, setIsInitializing] = useState(false);

  // Session state
  const [session, setSession] = useState<RippleSessionInfo | null>(null);
  const [messages, setMessages] = useState<RippleMessageInfo[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  // Streaming message accumulator
  const streamingMessageRef = useRef<{
    id: string;
    sessionId: string;
    role: "assistant";
    parts: RippleMessagePart[];
  } | null>(null);

  // UI state
  const [sessions, setSessions] = useState<RippleSessionInfo[]>([]);
  const [showSidebar, setShowSidebar] = useState(true);

  // Auto-scroll ref
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Initialize OpenCode server
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const currentStatus = await flow.ripple.getStatus();
        if (!cancelled) setStatus(currentStatus);

        if (currentStatus === "running") {
          // Load existing work sessions
          const workSessions = await flow.ripple.getSessions("work");
          if (!cancelled) setSessions(workSessions);
          return;
        }

        setIsInitializing(true);
        const success = await flow.ripple.initialize();
        if (!cancelled) {
          setStatus(success ? "running" : "error");
          setIsInitializing(false);
          if (success) {
            const workSessions = await flow.ripple.getSessions("work");
            if (!cancelled) setSessions(workSessions);
          }
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

  // Subscribe to Ripple events
  useEffect(() => {
    const removeListener = flow.ripple.onEvent((event: RippleEvent) => {
      switch (event.type) {
        case "status-changed":
          setStatus(event.status);
          break;

        case "message-start":
          streamingMessageRef.current = {
            id: event.messageId,
            sessionId: event.sessionId,
            role: "assistant",
            parts: []
          };
          setIsStreaming(true);
          break;

        case "message-part":
          if (streamingMessageRef.current && streamingMessageRef.current.id === event.messageId) {
            streamingMessageRef.current.parts = [...streamingMessageRef.current.parts, event.part];
            setMessages((prev) => {
              const existing = prev.findIndex((m) => m.id === event.messageId);
              const updated: RippleMessageInfo = {
                ...streamingMessageRef.current!,
                createdAt: new Date().toISOString()
              };
              if (existing >= 0) {
                const next = [...prev];
                next[existing] = updated;
                return next;
              }
              return [...prev, updated];
            });
          }
          break;

        case "message-complete":
          streamingMessageRef.current = null;
          setIsStreaming(false);
          break;

        case "session-updated":
          if (event.session.mode === "work") {
            setSessions((prev) => {
              const idx = prev.findIndex((s) => s.id === event.session.id);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = event.session;
                return next;
              }
              return [event.session, ...prev];
            });
          }
          break;
      }
    });

    return () => {
      removeListener();
    };
  }, []);

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

  // Create a new work session
  const handleNewSession = useCallback(async () => {
    if (status !== "running") return;

    try {
      const newSession = await flow.ripple.createSession("work");
      setSession(newSession);
      setMessages([]);
    } catch (e) {
      console.error("[Ripple Work] Failed to create session:", e);
    }
  }, [status]);

  // Select an existing session
  const handleSelectSession = useCallback(
    async (sessionId: string) => {
      const selected = sessions.find((s) => s.id === sessionId);
      if (!selected) return;

      setSession(selected);
      try {
        const msgs = await flow.ripple.getMessages(sessionId);
        setMessages(msgs);
      } catch {
        setMessages([]);
      }
    },
    [sessions]
  );

  // Send a prompt
  const handleSend = useCallback(
    async (text: string) => {
      let activeSession = session;

      // Auto-create a session if none exists
      if (!activeSession) {
        try {
          activeSession = await flow.ripple.createSession("work");
          setSession(activeSession);
        } catch (e) {
          console.error("[Ripple Work] Failed to create session:", e);
          return;
        }
      }

      // Optimistically add user message
      const userMsg: RippleMessageInfo = {
        id: `user-${Date.now()}`,
        sessionId: activeSession.id,
        role: "user",
        parts: [{ type: "text", text }],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        await flow.ripple.sendPrompt(activeSession.id, text);
      } catch (e) {
        console.error("[Ripple Work] Send prompt error:", e);
        setIsStreaming(false);
      }
    },
    [session]
  );

  // Abort generation
  const handleAbort = useCallback(async () => {
    if (!session) return;

    try {
      await flow.ripple.abort(session.id);
    } catch {
      // ignore
    }
    setIsStreaming(false);
    streamingMessageRef.current = null;
  }, [session]);

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
              const success = await flow.ripple.initialize();
              setStatus(success ? "running" : "error");
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
                      session?.id === s.id ? "bg-white/10 text-white/90" : "text-white/50"
                    )}
                  >
                    <div className="truncate">{s.title || "Untitled session"}</div>
                    <div className="text-[10px] text-white/25 mt-0.5">{formatTimestamp(s.createdAt)}</div>
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

function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
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

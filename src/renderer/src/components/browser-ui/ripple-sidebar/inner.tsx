import { cn } from "@/lib/utils";
import { useFocusedTabId } from "@/components/providers/tabs-provider";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  RippleMessageInfo,
  RippleSessionInfo,
  RippleEvent,
  RippleMessagePart,
  RippleStatus
} from "~/flow/interfaces/ripple/interface";
import { ChatMessages } from "./_components/chat-messages";
import { ChatInput } from "./_components/chat-input";
import { SettingsPanel } from "./_components/settings-panel";
import { SessionList } from "./_components/session-list";

/**
 * RippleSidebarInner
 *
 * Manages session lifecycle, message state, and event streaming
 * for Browse Mode. One session per tab.
 */
export function RippleSidebarInner() {
  const tabId = useFocusedTabId();

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

  // UI panels
  const [showSettings, setShowSettings] = useState(false);
  const [showSessionList, setShowSessionList] = useState(false);
  const [sessions, setSessions] = useState<RippleSessionInfo[]>([]);
  const [fsAccessEnabled, setFsAccessEnabled] = useState(false);

  // Initialize the OpenCode server on first render
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const currentStatus = await flow.ripple.getStatus();
        if (!cancelled) setStatus(currentStatus);

        if (currentStatus === "running") return;

        setIsInitializing(true);
        const success = await flow.ripple.initialize();
        if (!cancelled) {
          setStatus(success ? "running" : "error");
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
            // Force re-render with current streaming state
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
          setSessions((prev) => {
            const idx = prev.findIndex((s) => s.id === event.session.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = event.session;
              return next;
            }
            return [...prev, event.session];
          });
          break;
      }
    });

    return () => {
      removeListener();
    };
  }, []);

  // Get or create session when tab changes
  useEffect(() => {
    if (status !== "running" || tabId == null) return;

    let cancelled = false;

    async function loadSession() {
      try {
        const sessionInfo = await flow.ripple.getOrCreateTabSession(tabId!);
        if (cancelled) return;

        setSession(sessionInfo);
        setFsAccessEnabled(false);

        // Load existing messages
        const msgs = await flow.ripple.getMessages(sessionInfo.id);
        if (!cancelled) {
          setMessages(msgs);
        }
      } catch (e) {
        console.error("[Ripple] Failed to load session:", e);
      }
    }

    loadSession();
    return () => {
      cancelled = true;
    };
  }, [status, tabId]);

  // Load session list when dropdown is opened
  useEffect(() => {
    if (!showSessionList || status !== "running") return;

    flow.ripple.getSessions("browse").then(setSessions).catch(console.error);
  }, [showSessionList, status]);

  // Handlers
  const handleSend = useCallback(
    async (text: string) => {
      if (!session) return;

      // Optimistically add user message
      const userMsg: RippleMessageInfo = {
        id: `user-${Date.now()}`,
        sessionId: session.id,
        role: "user",
        parts: [{ type: "text", text }],
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        await flow.ripple.sendPrompt(session.id, text);
      } catch (e) {
        console.error("[Ripple] Send prompt error:", e);
        setIsStreaming(false);
      }
    },
    [session]
  );

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

  const handleToggleFsAccess = useCallback(
    async (enabled: boolean) => {
      if (!session) return;

      try {
        await flow.ripple.toggleFsAccess(session.id, enabled);
        setFsAccessEnabled(enabled);
      } catch {
        // ignore
      }
    },
    [session]
  );

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
            const success = await flow.ripple.initialize();
            setStatus(success ? "running" : "error");
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
        <button
          type="button"
          onClick={() => setShowSessionList(!showSessionList)}
          className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <span>Ripple</span>
          <span className="text-[10px] text-white/30">{showSessionList ? "\u25B2" : "\u25BC"}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSettings(!showSettings)}
          className={cn(
            "size-6 rounded flex items-center justify-center transition-colors",
            showSettings ? "bg-white/15 text-white/80" : "text-white/40 hover:text-white/70 hover:bg-white/10"
          )}
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>

      {/* Session List Dropdown */}
      <SessionList
        sessions={sessions}
        activeSessionId={session?.id ?? null}
        onSelectSession={handleSelectSession}
        isOpen={showSessionList}
        onClose={() => setShowSessionList(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        fsAccessEnabled={fsAccessEnabled}
        onToggleFsAccess={handleToggleFsAccess}
      />

      {/* Messages */}
      <ChatMessages messages={messages} isStreaming={isStreaming} />

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onAbort={handleAbort}
        isStreaming={isStreaming}
        disabled={status !== "running" || !session}
      />
    </div>
  );
}

/** Simple gear icon (inline SVG to avoid extra dependency). */
function SettingsIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

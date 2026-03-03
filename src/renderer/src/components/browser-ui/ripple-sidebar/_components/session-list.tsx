import { cn } from "@/lib/utils";
import type { RippleSessionInfo } from "~/flow/interfaces/ripple/interface";

interface SessionListProps {
  sessions: RippleSessionInfo[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionList({ sessions, activeSessionId, onSelectSession, isOpen, onClose }: SessionListProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 top-10 z-10 mx-2">
      {/* Backdrop */}
      <div className="fixed inset-0 z-0" onClick={onClose} />

      {/* Dropdown */}
      <div className="relative z-10 rounded-lg border border-white/10 bg-black/95 shadow-lg overflow-hidden max-h-60">
        <div className="overflow-y-auto max-h-60">
          {sessions.length === 0 ? (
            <div className="px-3 py-4 text-sm text-white/30 text-center">No sessions yet</div>
          ) : (
            sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={cn(
                  "w-full text-left px-3 py-2 text-sm transition-colors",
                  "hover:bg-white/10",
                  session.id === activeSessionId ? "text-white bg-white/5" : "text-white/60"
                )}
              >
                <div className="truncate">{session.title || `Session ${session.id.slice(0, 8)}`}</div>
                <div className="text-[10px] text-white/30 mt-0.5">{new Date(session.createdAt).toLocaleString()}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

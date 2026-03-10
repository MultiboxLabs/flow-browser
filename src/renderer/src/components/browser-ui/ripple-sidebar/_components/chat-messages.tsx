import type { RippleMessageInfo } from "~/flow/interfaces/ripple/interface";
import { MessageBubble } from "./message-bubble";
import { useEffect, useRef } from "react";

interface ChatMessagesProps {
  messages: RippleMessageInfo[];
  isStreaming: boolean;
}

export function ChatMessages({ messages, isStreaming }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Auto-scroll to bottom when new messages arrive (if user is already at bottom)
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

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-white/30 text-sm">Ask about this page</div>
          <div className="text-white/20 text-xs mt-1">
            Ripple can read, navigate, and interact with the current web page.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 py-2" onScroll={handleScroll}>
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} parts={msg.parts} />
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
  );
}

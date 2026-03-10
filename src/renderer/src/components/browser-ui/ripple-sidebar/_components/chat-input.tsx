import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onAbort: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export function ChatInput({ onSend, onAbort, isStreaming, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    onSend(trimmed);
    setText("");

    // Reset textarea height
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

    // Auto-resize textarea
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  return (
    <div className="shrink-0 px-3 pb-3">
      <div className="flex items-end gap-1.5 bg-white/5 rounded-lg border border-white/10 p-1.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about this page..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30",
            "resize-none outline-none min-h-[28px] max-h-[120px] py-1 px-1.5",
            "leading-snug",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onAbort}
            className={cn(
              "shrink-0 size-7 rounded-md flex items-center justify-center",
              "bg-red-500/80 hover:bg-red-500 text-white transition-colors",
              "text-xs font-medium"
            )}
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
              "shrink-0 size-7 rounded-md flex items-center justify-center",
              "bg-blue-600/80 hover:bg-blue-600 text-white transition-colors",
              "text-xs font-medium",
              (!text.trim() || disabled) && "opacity-30 cursor-not-allowed"
            )}
            title="Send message"
          >
            {"\u2191"}
          </button>
        )}
      </div>
    </div>
  );
}

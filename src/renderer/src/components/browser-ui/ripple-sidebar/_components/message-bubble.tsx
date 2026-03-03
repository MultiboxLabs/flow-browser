import { cn } from "@/lib/utils";
import type { RippleMessagePart } from "~/flow/interfaces/ripple/interface";
import { ToolCall } from "./tool-call";

interface MessageBubbleProps {
  role: "user" | "assistant";
  parts: RippleMessagePart[];
}

export function MessageBubble({ role, parts }: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser ? "bg-blue-600 text-white rounded-br-sm" : "bg-white/10 text-white/90 rounded-bl-sm"
        )}
      >
        {parts.map((part, i) => (
          <MessagePart key={i} part={part} />
        ))}
      </div>
    </div>
  );
}

function MessagePart({ part }: { part: RippleMessagePart }) {
  switch (part.type) {
    case "text":
      return <TextContent text={part.text} />;
    case "tool-invocation":
      return <ToolCall toolName={part.toolName} args={part.args} result={part.result} state={part.state} />;
    case "step-start":
      return part.title ? <div className="text-white/40 text-xs italic py-1">{part.title}</div> : null;
    default:
      return null;
  }
}

function TextContent({ text }: { text: string }) {
  if (!text) return null;

  // Split on newlines to preserve basic formatting
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

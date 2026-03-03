import { cn } from "@/lib/utils";
import { useState } from "react";

interface ToolCallProps {
  toolName: string;
  args: Record<string, unknown>;
  result?: string;
  state: string;
}

const TOOL_LABELS: Record<string, string> = {
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
  get_page_inputs: "Get page inputs"
};

function getToolLabel(toolName: string): string {
  return TOOL_LABELS[toolName] || toolName;
}

function getStatusIcon(state: string): string {
  switch (state) {
    case "completed":
      return "\u2713";
    case "running":
      return "\u25CF";
    case "error":
      return "\u2717";
    case "pending":
      return "\u25CB";
    default:
      return "\u25CF";
  }
}

export function ToolCall({ toolName, args, result, state }: ToolCallProps) {
  const [isExpanded, setExpanded] = useState(false);

  const label = getToolLabel(toolName);
  const statusIcon = getStatusIcon(state);

  const isRunning = state === "running" || state === "pending";
  const isError = state === "error";

  return (
    <div className="my-1.5 rounded-md border border-white/10 bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 px-2.5 py-1.5 text-xs",
          "hover:bg-white/5 transition-colors text-left"
        )}
      >
        <span
          className={cn(
            "shrink-0",
            isRunning && "text-yellow-400 animate-pulse",
            isError && "text-red-400",
            !isRunning && !isError && "text-green-400"
          )}
        >
          {statusIcon}
        </span>
        <span className="text-white/70 truncate flex-1">{label}</span>
        <span className="text-white/30 shrink-0">{isExpanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {isExpanded && (
        <div className="px-2.5 pb-2 border-t border-white/5">
          {Object.keys(args).length > 0 && (
            <div className="mt-1.5">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Args</div>
              <pre className="text-[11px] text-white/50 overflow-x-auto max-h-24 whitespace-pre-wrap break-all">
                {JSON.stringify(args, null, 2)}
              </pre>
            </div>
          )}
          {result && (
            <div className="mt-1.5">
              <div className="text-[10px] text-white/30 uppercase tracking-wider mb-0.5">Result</div>
              <pre className="text-[11px] text-white/50 overflow-x-auto max-h-32 whitespace-pre-wrap break-all">
                {result.length > 500 ? result.slice(0, 500) + "..." : result}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

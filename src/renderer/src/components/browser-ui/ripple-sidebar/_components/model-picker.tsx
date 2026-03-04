import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import type { RippleModelOption } from "@/lib/ripple-client";

interface ModelPickerProps {
  models: RippleModelOption[];
  selectedModel: { providerID: string; modelID: string } | null;
  onSelectModel: (model: { providerID: string; modelID: string }) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export function ModelPicker({ models, selectedModel, onSelectModel, isLoading, compact }: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (isLoading) {
    return <div className={cn("text-xs text-white/30", compact ? "px-2 py-1" : "px-3 py-2")}>Loading models...</div>;
  }

  if (models.length === 0) {
    return (
      <div className={cn("text-xs text-white/30", compact ? "px-2 py-1" : "px-3 py-2")}>
        No models available. Configure API keys in OpenCode.
      </div>
    );
  }

  const selectedOption = models.find(
    (m) => m.providerID === selectedModel?.providerID && m.modelID === selectedModel?.modelID
  );

  // Group models by provider
  const grouped = new Map<string, RippleModelOption[]>();
  for (const model of models) {
    const group = grouped.get(model.providerID) || [];
    group.push(model);
    grouped.set(model.providerID, group);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 bg-white/5 border border-white/10 rounded text-left",
          "hover:bg-white/10 transition-colors",
          compact ? "text-xs px-2 py-1.5" : "text-sm px-3 py-2"
        )}
      >
        <span className="truncate text-white/80">{selectedOption ? selectedOption.modelName : "Select model..."}</span>
        <span className="text-white/30 shrink-0 text-[10px]">{isOpen ? "\u25B2" : "\u25BC"}</span>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-1 w-full max-h-60 overflow-y-auto",
            "bg-neutral-900 border border-white/10 rounded-md shadow-lg"
          )}
        >
          {Array.from(grouped.entries()).map(([providerId, providerModels]) => (
            <div key={providerId}>
              <div className="px-3 py-1.5 text-[10px] text-white/30 uppercase tracking-wider sticky top-0 bg-neutral-900">
                {providerModels[0].providerName}
              </div>
              {providerModels.map((m) => {
                const isSelected = selectedModel?.providerID === m.providerID && selectedModel?.modelID === m.modelID;
                return (
                  <button
                    key={`${m.providerID}/${m.modelID}`}
                    type="button"
                    onClick={() => {
                      onSelectModel({ providerID: m.providerID, modelID: m.modelID });
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-1.5 text-sm transition-colors",
                      "hover:bg-white/10",
                      isSelected ? "bg-white/10 text-white" : "text-white/70"
                    )}
                  >
                    <div className="truncate">{m.modelName}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  fsAccessEnabled: boolean;
  onToggleFsAccess: (enabled: boolean) => void;
}

export function SettingsPanel({ isOpen, onClose, fsAccessEnabled, onToggleFsAccess }: SettingsPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-black/95">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-sm font-medium text-white/80">Settings</span>
        <button
          type="button"
          onClick={onClose}
          className="size-6 rounded flex items-center justify-center text-white/50 hover:text-white/80 hover:bg-white/10 transition-colors text-sm"
        >
          {"\u2715"}
        </button>
      </div>

      {/* Settings */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Filesystem Access */}
        <div className="space-y-1.5">
          <div className="text-xs text-white/50 uppercase tracking-wider">Permissions</div>
          <label className="flex items-center justify-between gap-3 cursor-pointer group">
            <div>
              <div className="text-sm text-white/80">Filesystem access</div>
              <div className="text-xs text-white/40">Allow Ripple to read and write files on your system</div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={fsAccessEnabled}
              onClick={() => onToggleFsAccess(!fsAccessEnabled)}
              className={cn(
                "relative shrink-0 inline-flex h-5 w-9 items-center rounded-full transition-colors",
                fsAccessEnabled ? "bg-blue-600" : "bg-white/20"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform",
                  fsAccessEnabled ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </label>
        </div>
      </div>
    </div>
  );
}

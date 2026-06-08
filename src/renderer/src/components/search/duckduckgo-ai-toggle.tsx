import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export function DuckDuckGoAiToggle({
  enabled,
  onEnabledChange,
  appearance = "settings"
}: {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  appearance?: "settings" | "onboarding";
}) {
  const isOnboarding = appearance === "onboarding";

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-2xl border p-5",
        isOnboarding ? "border-white/10 bg-white/5 backdrop-blur-md text-white" : "border-border/60 bg-muted/25"
      )}
    >
      <div className="space-y-2">
        <Label className={cn("text-sm font-medium", isOnboarding && "text-white")}>DuckDuckGo AI features</Label>
        <p className={cn("text-xs leading-5", isOnboarding ? "text-white/65" : "text-muted-foreground")}>
          Keep this on to allow DuckDuckGo&apos;s AI-assisted experience. Turn it off to force classic web results.
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={onEnabledChange} />
    </div>
  );
}

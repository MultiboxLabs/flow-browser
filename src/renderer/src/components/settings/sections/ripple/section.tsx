import { useSettings } from "@/components/providers/settings-provider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TooltipProvider } from "@/components/ui/tooltip";

export function RippleSettings() {
  const { getSetting, setSetting } = useSettings();
  const isEnabled = getSetting<boolean>("rippleEnabled");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Ripple</h2>
        <p className="text-muted-foreground">AI browsing and work agent powered by OpenCode</p>
      </div>

      <TooltipProvider>
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold tracking-tight text-card-foreground">Ripple Agent</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Enable Ripple to get an AI assistant that can browse the web and work on your filesystem.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enable toggle */}
            <div className="flex flex-row items-center justify-between gap-4 p-3 rounded-md hover:bg-muted/50 transition-colors">
              <div className="flex-1 space-y-0.5">
                <Label className="text-sm font-medium">Enable Ripple</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, Ripple adds a sidebar for browsing assistance and a dedicated work mode page.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isEnabled} onCheckedChange={(checked) => setSetting("rippleEnabled", checked)} />
              </div>
            </div>
          </div>
        </div>

        {isEnabled && (
          <div className="rounded-lg border bg-card p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold tracking-tight text-card-foreground">Getting Started</h3>
              <p className="text-sm text-muted-foreground mt-1">Requirements and usage information</p>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="p-3 rounded-md bg-muted/30">
                <p className="font-medium text-card-foreground mb-1">Prerequisites</p>
                <p>
                  Ripple requires <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">opencode</span> to be
                  installed and available in your PATH.
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/30">
                <p className="font-medium text-card-foreground mb-1">Browse Mode</p>
                <p>
                  Toggle the Ripple sidebar with{" "}
                  <kbd className="font-mono text-xs bg-muted rounded px-1.5 py-0.5 border border-border">
                    {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}+Shift+.
                  </kbd>{" "}
                  to chat with an AI that can read and interact with the current page.
                </p>
              </div>

              <div className="p-3 rounded-md bg-muted/30">
                <p className="font-medium text-card-foreground mb-1">Work Mode</p>
                <p>
                  Navigate to <span className="font-mono text-xs bg-muted rounded px-1 py-0.5">flow://ripple</span> for
                  a full-page AI workspace with filesystem and shell access.
                </p>
              </div>
            </div>
          </div>
        )}
      </TooltipProvider>
    </div>
  );
}

import { memo } from "react";
import { PortalComponent } from "@/components/portal/portal";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useFocusedTabId, useTabs } from "@/components/providers/tabs-provider";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";

interface WebPromptsProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function JavaScriptDialogCard() {
  return (
    <Card
      className={cn(
        "w-full max-w-md gap-0 select-none",
        "border border-white/25",
        "bg-neutral-950/96 text-white",
        "shadow-2xl shadow-black/40"
      )}
    >
      <CardHeader className="pb-0">
        <CardTitle className="text-lg text-white flex items-center">{"www.youtube.com says"}</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <p className="text-sm leading-6 text-white/88">How old are you?</p>
        <input
          defaultValue="5"
          autoFocus
          className={cn(
            "h-11 w-full rounded-lg border border-white/12 bg-white/8 px-4",
            "text-sm text-white outline-none"
          )}
        />
      </CardContent>

      <CardFooter className="justify-end gap-2 mt-4">
        <button
          type="button"
          className={cn(
            "h-9 rounded-lg px-3 text-sm font-medium text-white/75",
            "border border-white/12 bg-white/5 hover:bg-white/10 hover:text-white",
            "transition-colors duration-150"
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          className={cn(
            "h-9 rounded-lg px-3 text-sm font-medium",
            "bg-white text-black hover:bg-white/90",
            "transition-colors duration-150"
          )}
        >
          OK
        </button>
      </CardFooter>
    </Card>
  );
}

const TabWebPrompt = memo(function TabWebPrompt({
  isVisible,
  portalStyle
}: {
  isVisible: boolean;
  portalStyle: React.CSSProperties;
}) {
  return (
    <PortalComponent visible={isVisible} autoFocus zIndex={ViewLayer.OVERLAY} className="fixed" style={portalStyle}>
      <div className={cn("w-full h-full", "bg-black/25 rounded-lg", "flex items-center justify-center")}>
        <JavaScriptDialogCard />
      </div>
    </PortalComponent>
  );
});

export function WebPrompts({ anchorRef }: WebPromptsProps) {
  const focusedTabId = useFocusedTabId();
  const { tabsData } = useTabs();
  const anchorRect = useBoundingRect(anchorRef);

  if (!tabsData || !anchorRect) return null;

  const portalStyle: React.CSSProperties = {
    top: anchorRect.y,
    left: anchorRect.x,
    width: anchorRect.width,
    height: anchorRect.height
  };

  // return null;

  return (
    <>
      {tabsData.tabs.map((tab) => (
        <TabWebPrompt key={tab.id} isVisible={tab.id === focusedTabId} portalStyle={portalStyle} />
      ))}
    </>
  );
}

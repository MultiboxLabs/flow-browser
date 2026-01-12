import { SidebarVariant } from "@/components/browser-ui/main";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";
import { useMemo } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { PinGridGate } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/gate";
import { SpaceTitle } from "@/components/browser-ui/browser-sidebar/_components/space-title";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";
import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight, currentSpace } = useSpaces();
  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  return (
    <div className={cn(spaceInjectedClasses, "h-full flex flex-col overflow-hidden pb-3")}>
      {/* Top Section */}
      {direction === "left" && platform === "darwin" && (
        <div className="shrink-0 flex flex-col p-1">
          <SidebarWindowControlsMacOS offset={variant === "floating" ? 11 : 5} isAnimating={isAnimating} />
          <div className="h-2" />
        </div>
      )}
      {/* Middle Section */}
      <div className="flex-1 min-h-0 gap-2 flex flex-col overflow-hidden">
        <AddressBar />
        <PinGridGate />
        <SpaceTitle space={currentSpace} />
        {/* Space Scrollable Content */}
        <SidebarScrollArea className="flex-1 min-h-0">
          <div className="grid gap-2">
            {Array.from({ length: 100 }).map((_, index) => (
              <span key={index}>Hello World!</span>
            ))}
          </div>
        </SidebarScrollArea>
      </div>
      {/* Bottom Section */}
      <div className="shrink-0 flex items-center justify-between py-3 px-0 h-14">
        <Button
          size="icon"
          className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
          onClick={() => flow.windows.openSettingsWindow()}
        >
          <Settings strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10" disabled>
          <Plus strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </div>
    </div>
  );
}

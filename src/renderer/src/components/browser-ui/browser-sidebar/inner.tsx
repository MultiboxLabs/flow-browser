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

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight, currentSpace } = useSpaces();
  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  return (
    <div className={cn(spaceInjectedClasses, "h-full")}>
      {direction === "left" && platform === "darwin" && (
        <div className="flex flex-col p-1">
          <SidebarWindowControlsMacOS offset={variant === "floating" ? 11 : 5} isAnimating={isAnimating} />
          <div className="h-2" />
        </div>
      )}
      <div className="w-full h-full gap-2 flex flex-col overflow-hidden">
        <AddressBar />
        <PinGridGate />
        <SpaceTitle space={currentSpace} />
      </div>
    </div>
  );
}

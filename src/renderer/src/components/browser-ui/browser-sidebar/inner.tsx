import { SidebarVariant } from "@/components/browser-ui/main";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";
import { PinGrid } from "./_components/pin-grid";

import { useMemo } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  return (
    <div className={spaceInjectedClasses}>
      {direction === "left" && platform === "darwin" && (
        <div className="flex flex-col p-1">
          <SidebarWindowControlsMacOS offset={variant === "floating" ? 11 : 5} isAnimating={isAnimating} />
          <div className="h-2" />
        </div>
      )}
      <div className="w-full h-full gap-2 flex flex-col">
        <AddressBar />
        <PinGrid />
      </div>
    </div>
  );
}

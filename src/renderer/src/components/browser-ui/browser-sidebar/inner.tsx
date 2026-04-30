import { SidebarVariant } from "@/components/browser-ui/types";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";
import { useCallback, useMemo } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { NavigationControls, NavButton } from "@/components/browser-ui/browser-sidebar/_components/navigation-controls";
import { SlotMachineGuard } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/guard";
import {
  SlotMachinePinGrid,
  resetSlotMachine
} from "@/components/browser-ui/browser-sidebar/_components/pin-grid/slot-machine/main";
import { DownloadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceSwitcher } from "@/components/browser-ui/browser-sidebar/_components/bottom/space-switcher";
import { SpacePagesCarousel } from "@/components/browser-ui/browser-sidebar/_components/space-pages-carousel";
import { UpdateBanner } from "@/components/browser-ui/browser-sidebar/_components/update-banner";
import { BottomExtrasMenu } from "@/components/browser-ui/browser-sidebar/_components/bottom/bottom-extras-menu";

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x={4.625} y={3.75} width={30.75} height={24.5} rx={4.75} ry={4.75} />
      <path strokeLinecap="square" d="M15.25 5v22" />
      <path strokeWidth={2} d="M9 9.5h2M9 13.5h2M9 17.5h2" />
    </svg>
  );
}

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating, setVisible, mode, slotMachineEnabled, setSlotMachineEnabled } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight } = useSpaces();

  const handleSetSlotMachine = useCallback(
    (enabled: boolean) => {
      if (!enabled) resetSlotMachine();
      setSlotMachineEnabled(enabled);
    },
    [setSlotMachineEnabled]
  );

  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  return (
    <div className={cn(spaceInjectedClasses, "h-full max-h-full flex flex-col overflow-hidden")}>
      {/* Top Section */}
      <div className="shrink-0 flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5">
          {direction === "left" && platform === "darwin" && (
            <SidebarWindowControlsMacOS isAnimating={isAnimating || variant === "floating"} />
          )}
          <NavButton
            icon={<SidebarIcon className="size-5.5" />}
            onClick={() => setVisible(!mode.startsWith("attached"))}
          />
        </div>
        <NavigationControls />
      </div>
      {/* Middle Section */}
      <div className="flex-1 min-h-0 gap-2 flex flex-col overflow-hidden">
        <AddressBar />
        <SlotMachineGuard passed={slotMachineEnabled} setPassed={handleSetSlotMachine} />
        {slotMachineEnabled && <SlotMachinePinGrid />}
        <SpacePagesCarousel />
      </div>
      {/* Update Banner */}
      <UpdateBanner />
      {/* Bottom Section */}
      <div className="shrink-0 flex items-center justify-between h-4 my-2">
        <BottomExtrasMenu />
        <SpaceSwitcher />
        <Button
          size="icon"
          className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
          // onClick={() => flow.windows.openSettingsWindow()}
          disabled
        >
          <DownloadIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </div>
      <div className="h-3" />
    </div>
  );
}

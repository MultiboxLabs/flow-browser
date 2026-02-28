import { SidebarVariant } from "@/components/browser-ui/main";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";
import { useMemo } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { NavigationControls, NavButton } from "@/components/browser-ui/browser-sidebar/_components/navigation-controls";
import { PinGridGate } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/gate";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpaceSwitcher } from "@/components/browser-ui/browser-sidebar/_components/space-switcher";
import { SpacePagesCarousel } from "@/components/browser-ui/browser-sidebar/_components/space-pages-carousel";
import { BrowserActionList } from "@/components/browser-ui/browser-sidebar/_components/browser-action-list";

function SidebarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM9 3v18" />
    </svg>
  );
}

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating, setVisible, mode } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight } = useSpaces();

  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  return (
    <div className={cn(spaceInjectedClasses, "h-full max-h-full flex flex-col overflow-hidden")}>
      {/* Top Section */}
      <div className="shrink-0 flex items-center justify-between px-1 pb-2">
        <div className="flex items-center gap-1.5">
          {direction === "left" && platform === "darwin" && (
            <SidebarWindowControlsMacOS offset={variant === "floating" ? 13 : 7} isAnimating={isAnimating} />
          )}
          <NavButton
            icon={<SidebarIcon className="size-4" />}
            onClick={() => setVisible(!mode.startsWith("attached"))}
          />
        </div>
        <NavigationControls />
      </div>
      {/* Middle Section */}
      <div className="flex-1 min-h-0 gap-2 flex flex-col overflow-hidden">
        <AddressBar />
        <PinGridGate />
        <SpacePagesCarousel />
      </div>
      {/* Bottom Section */}
      <div className="shrink-0 flex items-center justify-between h-4 my-2">
        <Button
          size="icon"
          className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
          onClick={() => flow.windows.openSettingsWindow()}
        >
          <Settings strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
        <SpaceSwitcher />
        <BrowserActionList />
      </div>
      <div className="h-3" />
    </div>
  );
}

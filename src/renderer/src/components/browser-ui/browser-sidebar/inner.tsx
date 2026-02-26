import { SidebarVariant } from "@/components/browser-ui/main";
import { AttachedDirection, useBrowserSidebar } from "./provider";
import { SidebarWindowControlsMacOS } from "@/components/browser-ui/window-controls/macos";
import { usePlatform } from "@/components/main/platform";
import { AddressBar } from "./_components/address-bar";
import { useCallback, useMemo } from "react";
import { useSpaces } from "@/components/providers/spaces-provider";
import { cn } from "@/lib/utils";
import { NavigationControls } from "@/components/browser-ui/browser-sidebar/_components/navigation-controls";
import { PinGridGate } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/gate";
import { SpaceTitle } from "@/components/browser-ui/browser-sidebar/_components/space-title";
import { SidebarScrollArea } from "@/components/browser-ui/browser-sidebar/_components/sidebar-scroll-area";
import { Settings, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabGroup } from "@/components/browser-ui/browser-sidebar/_components/tab-group";
import { TabDropTarget } from "@/components/browser-ui/browser-sidebar/_components/tab-drop-target";
import { useTabs } from "@/components/providers/tabs-provider";
import { AnimatePresence } from "motion/react";
import { NewTabButton } from "@/components/browser-ui/browser-sidebar/_components/new-tab-button";

export function SidebarInner({ direction, variant }: { direction: AttachedDirection; variant: SidebarVariant }) {
  const { isAnimating } = useBrowserSidebar();
  const { platform } = usePlatform();

  const { isCurrentSpaceLight, currentSpace } = useSpaces();
  const { tabGroups: allTabGroups, getActiveTabGroup, getFocusedTab } = useTabs();

  const spaceInjectedClasses = useMemo(() => cn(isCurrentSpaceLight ? "" : "dark"), [isCurrentSpaceLight]);

  // Filter and sort in one useMemo with stable dependencies.
  // Previously, getTabGroups() created a new array via .filter() on every call,
  // which broke the downstream useMemo on sortedTabGroups.
  const sortedTabGroups = useMemo(() => {
    if (!currentSpace) return [];
    return allTabGroups.filter((tg) => tg.spaceId === currentSpace.id).sort((a, b) => a.position - b.position);
  }, [allTabGroups, currentSpace]);

  const activeTabGroup = useMemo(() => {
    if (!currentSpace) return null;
    return getActiveTabGroup(currentSpace.id);
  }, [getActiveTabGroup, currentSpace]);

  const focusedTab = useMemo(() => {
    if (!currentSpace) return null;
    return getFocusedTab(currentSpace.id);
  }, [getFocusedTab, currentSpace]);

  const moveTab = useCallback((tabId: number, newPosition: number) => {
    flow.tabs.moveTab(tabId, newPosition);
  }, []);

  const handleNewTab = useCallback(() => {
    flow.newTab.open();
  }, []);

  return (
    <div className={cn(spaceInjectedClasses, "h-full max-h-full flex flex-col overflow-hidden")}>
      {/* Top Section */}
      <div className="shrink-0 flex items-center justify-between px-1 pb-2">
        {direction === "left" && platform === "darwin" ? (
          <SidebarWindowControlsMacOS offset={variant === "floating" ? 12 : 7} isAnimating={isAnimating} />
        ) : (
          <div />
        )}
        <NavigationControls />
      </div>
      {/* Middle Section */}
      <div className="flex-1 min-h-0 gap-2 flex flex-col overflow-hidden">
        <AddressBar />
        <PinGridGate />
        <SpaceTitle space={currentSpace} />
        {/* Space Scrollable Content */}
        <SidebarScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-1 flex-1 min-h-full">
            <NewTabButton />
            <AnimatePresence initial={false}>
              {sortedTabGroups.map((tabGroup) => (
                <TabGroup
                  key={tabGroup.id}
                  tabGroup={tabGroup}
                  isActive={activeTabGroup?.id === tabGroup.id}
                  isFocused={!!focusedTab && tabGroup.tabs.some((tab) => tab.id === focusedTab.id)}
                  isSpaceLight={isCurrentSpaceLight}
                  position={tabGroup.position}
                  groupCount={sortedTabGroups.length}
                  moveTab={moveTab}
                />
              ))}
            </AnimatePresence>
            {currentSpace && (
              <TabDropTarget
                spaceData={currentSpace}
                isSpaceLight={isCurrentSpaceLight}
                moveTab={moveTab}
                biggestIndex={sortedTabGroups.length > 0 ? sortedTabGroups[sortedTabGroups.length - 1].position : -1}
              />
            )}
          </div>
        </SidebarScrollArea>
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
        <Button
          size="icon"
          className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10"
          onClick={handleNewTab}
        >
          <Plus strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </div>
      <div className="h-3" />
    </div>
  );
}

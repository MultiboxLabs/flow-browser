import { NewTabButton } from "@/components/browser-ui/sidebar/content/new-tab-button";
import { SidebarTabGroups } from "@/components/browser-ui/sidebar/content/sidebar-tab-groups";
import { SpaceTitle } from "@/components/browser-ui/sidebar/content/space-title";
import { useTabs } from "@/components/providers/tabs-provider";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarMenu } from "@/components/ui/resizable-sidebar";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { cn, hex_is_light } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef } from "react";
import { DropIndicator as BaseDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/list-item";

const ENABLE_SECTION_DEVIDER = true;

export function DropIndicator({ isSpaceLight }: { isSpaceLight: boolean }) {
  return (
    <ol
      className="flex *:mx-2 relative h-0 -m-0.5"
      style={
        {
          "--ds-border-selected": isSpaceLight ? "#000" : "#fff"
        } as React.CSSProperties
      }
    >
      <BaseDropIndicator
        instruction={{
          axis: "vertical",
          operation: "reorder-after",
          blocked: false
        }}
        lineGap="0px"
        lineType="terminal-no-bleed"
      />
    </ol>
  );
}

function SidebarSectionDivider({ hasTabs, handleCloseAllTabs }: { hasTabs: boolean; handleCloseAllTabs: () => void }) {
  if (!hasTabs) return null;

  return (
    <motion.div
      className={cn("flex flex-row", "items-center justify-between", "mx-1 my-3", "h-1 gap-1")}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn("h-[1px] flex-grow", "bg-black/10 dark:bg-white/25")} />
      <Button
        className={cn(
          "h-1 !p-1 rounded-sm",
          "text-black/50 dark:text-white/50",
          "hover:text-black/80 dark:hover:text-white/80",
          "hover:bg-transparent hover:dark:bg-transparent"
        )}
        variant="ghost"
        size="sm"
        onClick={handleCloseAllTabs}
      >
        <span className="text-xs font-semibold">Clear</span>
      </Button>
    </motion.div>
  );
}

export function SpaceSidebar({ space }: { space: Space }) {
  const { getTabGroups, getActiveTabGroup, getFocusedTab } = useTabs();

  const tabGroups = getTabGroups(space.id);

  const activeTabGroup = getActiveTabGroup(space.id);
  const focusedTab = getFocusedTab(space.id);

  const isSpaceLight = hex_is_light(space.bgStartColor || "#000000");

  const handleCloseAllTabs = useCallback(() => {
    const closeActive = tabGroups.length <= 1;

    for (const tabGroup of tabGroups) {
      const isTabGroupActive = activeTabGroup?.id === tabGroup.id;

      if (!closeActive && isTabGroupActive) continue;

      for (const tab of tabGroup.tabs) {
        flow.tabs.closeTab(tab.id);
      }
    }
  }, [tabGroups, activeTabGroup]);

  const sidebarRef = useRef<HTMLDivElement>(null);

  const hasTabs = tabGroups.length > 0;

  return (
    <div className={cn(isSpaceLight ? "" : "dark", "h-full")} ref={sidebarRef}>
      <SpaceTitle space={space} />
      <SidebarGroup className="py-0.5">
        <SidebarMenu>
          {ENABLE_SECTION_DEVIDER && (
            <AnimatePresence>
              {hasTabs && <SidebarSectionDivider hasTabs={hasTabs} handleCloseAllTabs={handleCloseAllTabs} />}
            </AnimatePresence>
          )}
          <NewTabButton />
          <div className="flex flex-col justify-between gap-1">
            <AnimatePresence initial={false}>
              {tabGroups
                .sort((a, b) => a.order - b.order)
                .map((tabGroup) => (
                  <SidebarTabGroups
                    key={tabGroup.id}
                    tabGroup={tabGroup}
                    isActive={activeTabGroup?.id === tabGroup.id || false}
                    isFocused={!!focusedTab && tabGroup.tabs.some((tab) => tab.id === focusedTab.id)}
                    isSpaceLight={isSpaceLight}
                  />
                ))}
            </AnimatePresence>
          </div>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}

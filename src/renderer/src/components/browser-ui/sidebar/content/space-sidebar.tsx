import { NewTabButton } from "@/components/browser-ui/sidebar/content/new-tab-button";
import { SidebarTabGroups } from "@/components/browser-ui/sidebar/content/sidebar-tab-groups";
import { SpaceTitle } from "@/components/browser-ui/sidebar/content/space-title";
import { useTabs } from "@/components/providers/tabs-provider";
import { Button } from "@/components/ui/button";
import { SidebarGroup, SidebarMenu, useSidebar } from "@/components/ui/resizable-sidebar";
import { Space } from "~/flow/interfaces/sessions/spaces";
import { cn, hex_is_light } from "@/lib/utils";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useMemo, useRef } from "react";
import { DropIndicator as BaseDropIndicator } from "@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/list-item";
import { SidebarTabDropTarget } from "@/components/browser-ui/sidebar/content/sidebar-tab-drop-target";

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
  const { open } = useSidebar();

  if (!hasTabs) return null;

  return (
    <motion.div
      className={cn("flex flex-row", "items-center justify-between", "h-1 gap-1", open ? "mx-1 my-3" : "mx-1 my-1")}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <div className={cn("h-[1px] flex-grow", "bg-black/10 dark:bg-white/25")} />
      {open && (
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
      )}
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

  const sortedTabGroups = useMemo(() => {
    return [...tabGroups].sort((a, b) => a.position - b.position);
  }, [tabGroups]);

  const moveTab = useCallback(
    (tabId: number, newPosition: number) => {
      const newSortedTabGroups = [...sortedTabGroups].sort((a, b) => {
        const isTabInGroupA = a.tabs.some((tab) => tab.id === tabId);
        const isTabInGroupB = b.tabs.some((tab) => tab.id === tabId);

        const aIndex = newSortedTabGroups.findIndex((tabGroup) => tabGroup.id === a.id);
        const bIndex = newSortedTabGroups.findIndex((tabGroup) => tabGroup.id === b.id);

        const aPos = isTabInGroupA ? newPosition : aIndex;
        const bPos = isTabInGroupB ? newPosition : bIndex;

        return aPos - bPos;
      });

      for (const [index, tabGroup] of newSortedTabGroups.entries()) {
        if (tabGroup.position !== index) {
          flow.tabs.moveTab(tabGroup.tabs[0].id, index);
        }
      }
    },
    [sortedTabGroups]
  );

  return (
    <div className={cn(isSpaceLight ? "" : "dark", "h-full flex flex-col")} ref={sidebarRef}>
      <SpaceTitle space={space} />
      <SidebarGroup className="py-0.5 flex-1">
        <SidebarMenu className="flex-1">
          {ENABLE_SECTION_DEVIDER && (
            <AnimatePresence>
              {hasTabs && <SidebarSectionDivider hasTabs={hasTabs} handleCloseAllTabs={handleCloseAllTabs} />}
            </AnimatePresence>
          )}
          <NewTabButton />
          <div className="flex-1 flex flex-col justify-between gap-1">
            <AnimatePresence initial={false}>
              {sortedTabGroups.map((tabGroup, index) => (
                <SidebarTabGroups
                  key={tabGroup.id}
                  tabGroup={tabGroup}
                  isActive={activeTabGroup?.id === tabGroup.id || false}
                  isFocused={!!focusedTab && tabGroup.tabs.some((tab) => tab.id === focusedTab.id)}
                  isSpaceLight={isSpaceLight}
                  position={index}
                  moveTab={moveTab}
                />
              ))}
              <SidebarTabDropTarget
                spaceData={space}
                isSpaceLight={isSpaceLight}
                moveTab={moveTab}
                biggestIndex={sortedTabGroups.length - 1}
              />
            </AnimatePresence>
          </div>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}

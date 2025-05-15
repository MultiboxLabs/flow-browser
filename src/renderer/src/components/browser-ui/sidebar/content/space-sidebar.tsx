import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { NewTabButton } from "@/components/browser-ui/sidebar/content/new-tab-button";
import { SidebarTabGroups } from "@/components/browser-ui/sidebar/content/sidebar-tab-groups";
import { SpaceTitle } from "@/components/browser-ui/sidebar/content/space-title";
import { useTabs } from "@/components/providers/tabs-provider";
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu } from "@/components/ui/resizable-sidebar";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { cn, hex_is_light } from "@/lib/utils";
import { Trash2Icon } from "lucide-react";
import { AnimatePresence, Reorder } from "motion/react";
import { useCallback, useMemo, useRef, useState } from "react";

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

  const [tabGroupsOrder, setTabGroupsOrder] = useState<number[]>([]);
  const handleReorder = (newOrder: number[]) => {
    console.log("newOrder", newOrder);
    setTabGroupsOrder(newOrder);
  };

  const sortedTabGroups = useMemo(() => {
    return tabGroups.sort((a, b) => tabGroupsOrder.indexOf(a.id) - tabGroupsOrder.indexOf(b.id));
  }, [tabGroups, tabGroupsOrder]);

  const [draggingTabGroup, setDraggingTabGroup] = useState<number | null>(null);

  return (
    <div className={cn(isSpaceLight ? "" : "dark", "h-full")} ref={sidebarRef}>
      <SpaceTitle space={space} />
      <SidebarGroup>
        <SidebarGroupLabel className="font-medium text-black dark:text-white">Tabs</SidebarGroupLabel>
        <SidebarGroupAction onClick={handleCloseAllTabs} className={cn(SIDEBAR_HOVER_COLOR, "size-6")}>
          <Trash2Icon className="size-1.5 m-1 text-black dark:text-white" />
        </SidebarGroupAction>
        <SidebarMenu>
          <NewTabButton />
          <AnimatePresence initial={false}>
            <Reorder.Group
              as="div"
              layout
              onReorder={handleReorder}
              values={sortedTabGroups.map((tabGroup) => tabGroup.id)}
              axis="y"
            >
              {sortedTabGroups.map((tabGroup) => (
                <Reorder.Item
                  key={tabGroup.id}
                  value={tabGroup.id}
                  dragConstraints={sidebarRef}
                  dragElastic={0}
                  dragSnapToOrigin={true}
                  onDragStart={() => setDraggingTabGroup(tabGroup.id)}
                  onDragEnd={() => setDraggingTabGroup(null)}
                >
                  <SidebarTabGroups
                    tabGroup={tabGroup}
                    isActive={activeTabGroup?.id === tabGroup.id || false}
                    isFocused={!!focusedTab && tabGroup.tabs.some((tab) => tab.id === focusedTab.id)}
                    isDragging={draggingTabGroup === tabGroup.id}
                  />
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </AnimatePresence>
        </SidebarMenu>
      </SidebarGroup>
    </div>
  );
}

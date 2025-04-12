import { NewTabButton } from "@/components/browser-ui/sidebar/content/new-tab-button";
import { SidebarTab } from "@/components/browser-ui/sidebar/content/sidebar-tab";
import { SpaceTitle } from "@/components/browser-ui/sidebar/content/space-title";
import { useTabs } from "@/components/providers/tabs-provider";
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu } from "@/components/ui/resizable-sidebar";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { Trash2Icon } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useMemo } from "react";

export function SpaceSidebar({ space }: { space: Space }) {
  const handleCloseAllTabs = () => {
    // TODO: Close all tabs
  };

  const { tabsData, getActiveTabId, getFocusedTabId } = useTabs();
  const tabs = useMemo(() => {
    return tabsData?.tabs.filter((tab) => tab.spaceId === space.id) || [];
  }, [tabsData, space.id]);

  const activeTabId = getActiveTabId(space.id);
  const focusedTabId = getFocusedTabId(space.id);

  return (
    <>
      <SidebarGroup>
        <SpaceTitle space={space} />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Tabs</SidebarGroupLabel>
        <SidebarGroupAction onClick={handleCloseAllTabs} className="hover:bg-white/10 active:bg-white/15">
          <Trash2Icon className="size-1.5 m-1 text-muted-foreground" />
        </SidebarGroupAction>
        <SidebarMenu>
          <NewTabButton />
          <AnimatePresence initial={true}>
            {tabs
              .map((tab) => (
                <SidebarTab
                  key={tab.id}
                  tab={tab}
                  isActive={activeTabId === tab.id}
                  isFocused={focusedTabId === tab.id}
                />
              ))
              .reverse()}
          </AnimatePresence>
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

import { SidebarTab } from "@/components/browser-ui/sidebar/tab";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/sidebar";
import { useBrowser } from "@/components/main/browser-context";
import { PlusIcon } from "lucide-react";
import { AnimatePresence } from "motion/react";

function NewTabButton() {
  const { handleCreateTab } = useBrowser();

  return (
    <SidebarMenuButton className="select-none" onClick={handleCreateTab}>
      <PlusIcon className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">New Tab</span>
    </SidebarMenuButton>
  );
}

export function SidebarTabs() {
  const { tabs } = useBrowser();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Tabs</SidebarGroupLabel>
      <SidebarMenu>
        <NewTabButton />
        <AnimatePresence initial={false}>
          {tabs.map((tab) => (
            <SidebarTab key={tab.id} tab={tab} />
          ))}
        </AnimatePresence>
      </SidebarMenu>
    </SidebarGroup>
  );
}

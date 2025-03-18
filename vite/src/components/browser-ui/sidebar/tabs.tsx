import { SidebarTab } from "@/components/browser-ui/sidebar/tab";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu } from "@/components/ui/sidebar";
import { useBrowser } from "@/components/main/browser-context";

export function SidebarTabs() {
  const { tabs } = useBrowser();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Tabs</SidebarGroupLabel>
      <SidebarMenu>
        {tabs.map((tab) => (
          <SidebarTab key={tab.id} tab={tab} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

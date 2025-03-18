import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { SidebarTabs } from "@/components/browser-ui/sidebar/tabs";

export function BrowserSidebar() {
  return (
    <Sidebar side="left" variant="inset">
      <SidebarHeader>
        <div className="h-[calc(env(titlebar-area-y)+env(titlebar-area-height)+1px-1rem)] w-full app-drag" />
        <SidebarMenu>
          <SidebarMenuItem>Flow Browser</SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarTabs />
      </SidebarContent>
    </Sidebar>
  );
}

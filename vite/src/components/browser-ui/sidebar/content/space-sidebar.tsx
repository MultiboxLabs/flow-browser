import { NewTabButton } from "@/components/browser-ui/sidebar/content/new-tab-button";
import { SpaceTitle } from "@/components/browser-ui/sidebar/content/space-title";
import { SidebarGroup, SidebarGroupAction, SidebarGroupLabel, SidebarMenu } from "@/components/ui/resizable-sidebar";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { Trash2Icon } from "lucide-react";

export function SpaceSidebar({ space }: { space: Space }) {
  const handleCloseAllTabs = () => {
    // TODO: Close all tabs
  };

  return (
    <>
      <SidebarGroup>
        <SpaceTitle space={space} />
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Tabs</SidebarGroupLabel>
        <SidebarGroupAction onClick={handleCloseAllTabs} className="hover:bg-white/5 active:bg-white/10">
          <Trash2Icon className="size-1.5 m-1 text-muted-foreground" />
        </SidebarGroupAction>
        <SidebarMenu>
          <NewTabButton />
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

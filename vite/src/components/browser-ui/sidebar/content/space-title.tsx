import { useEffect, useState } from "react";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { CircleHelpIcon, LucideIcon } from "lucide-react";
import { getLucideIcon } from "@/lib/utils";
import { SidebarGroup, SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";

export function SpaceTitle({ space }: { space: Space }) {
  const { open } = useSidebar();
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);

  useEffect(() => {
    getLucideIcon(space.icon).then(setIcon);
  }, [space.icon]);

  if (!open) return null;

  return (
    <SidebarGroup>
      <SidebarMenuButton className="!opacity-100" disabled>
        <Icon strokeWidth={2.5} className="text-black dark:text-white" />
        <span className="font-bold text-black dark:text-white">{space.name}</span>
      </SidebarMenuButton>
    </SidebarGroup>
  );
}

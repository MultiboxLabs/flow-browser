import { useEffect, useState } from "react";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { CircleHelpIcon, LucideIcon } from "lucide-react";
import { getLucideIcon } from "@/lib/utils";
import { SidebarMenuButton } from "@/components/ui/resizable-sidebar";

export function SpaceTitle({ space }: { space: Space }) {
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);

  useEffect(() => {
    getLucideIcon(space.icon).then(setIcon);
  }, [space.icon]);

  return (
    <SidebarMenuButton className="text-primary !opacity-100" disabled>
      <Icon strokeWidth={3} />
      <span className="font-bold">{space.name}</span>
    </SidebarMenuButton>
  );
}

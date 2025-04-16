import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { SidebarGroup, SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { DynamicLucideIcon } from "@/components/main/dynamic-lucide-icon";

export function SpaceTitle({ space }: { space: Space }) {
  const { open } = useSidebar();

  if (!open) return null;

  return (
    <SidebarGroup>
      <SidebarMenuButton className="!opacity-100" disabled>
        <DynamicLucideIcon iconId={space.icon} strokeWidth={2.5} className="text-black dark:text-white" />
        <span className="font-bold text-black dark:text-white">{space.name}</span>
      </SidebarMenuButton>
    </SidebarGroup>
  );
}

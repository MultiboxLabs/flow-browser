import { Space } from "~/flow/interfaces/sessions/spaces";
import { SidebarGroup, SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { SpaceIcon } from "@/lib/phosphor-icons";

export function SpaceTitle({ space }: { space: Space }) {
  const { open } = useSidebar();

  if (!open) return null;

  return (
    <SidebarGroup className="py-0.5">
      <SidebarMenuButton className="!opacity-100" disabled>
        <SpaceIcon fallbackId={undefined} id={space.icon} strokeWidth={2.5} className="text-black dark:text-white" />
        <span className="font-bold text-black dark:text-white">{space.name}</span>
      </SidebarMenuButton>
    </SidebarGroup>
  );
}

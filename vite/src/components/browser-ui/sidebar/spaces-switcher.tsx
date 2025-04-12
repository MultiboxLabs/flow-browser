import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { useEffect, useState } from "react";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { cn, getLucideIcon } from "@/lib/utils";
import { CircleHelpIcon, LucideIcon } from "lucide-react";
import { useSpaces } from "@/components/providers/spaces-provider";

type SpaceButtonProps = {
  space: Space;
  isActive: boolean;
  onClick: () => void;
};

function SpaceButton({ space, isActive, onClick }: SpaceButtonProps) {
  const [Icon, setIcon] = useState<LucideIcon>(CircleHelpIcon);

  useEffect(() => {
    getLucideIcon(space.icon).then(setIcon);
  }, [space.icon]);

  return (
    <SidebarMenuButton key={space.id} onClick={onClick} className="hover:bg-white/10 active:bg-white/15">
      <Icon
        strokeWidth={3}
        className={cn("transition-colors duration-300", "text-muted-foreground", isActive && "text-white")}
      />
    </SidebarMenuButton>
  );
}

export function SidebarSpacesSwitcher() {
  const { spaces, currentSpace, setCurrentSpace } = useSpaces();

  return (
    <SidebarMenuItem className="flex flex-row gap-0.5">
      {spaces.map((space) => (
        <SpaceButton
          key={space.id}
          space={space}
          isActive={currentSpace?.id === space.id}
          onClick={() => setCurrentSpace(space.id)}
        />
      ))}
    </SidebarMenuItem>
  );
}

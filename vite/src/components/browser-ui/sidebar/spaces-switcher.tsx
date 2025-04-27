import { SidebarMenuItem, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { Space } from "@/lib/flow/interfaces/sessions/spaces";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { SpaceIcon } from "@/lib/phosphor-icons";

type SpaceButtonProps = {
  space: Space;
  isActive: boolean;
  onClick: () => void;
};

function SpaceButton({ space, isActive, onClick }: SpaceButtonProps) {
  return (
    <SidebarMenuButton key={space.id} onClick={onClick} className={SIDEBAR_HOVER_COLOR}>
      <SpaceIcon
        id={space.icon}
        strokeWidth={2.5}
        className={cn(
          "transition-colors duration-300",
          "text-black/40 dark:text-white/40",
          isActive && "text-black dark:text-white"
        )}
      />
    </SidebarMenuButton>
  );
}

export function SidebarSpacesSwitcher() {
  const { spaces, currentSpace, setCurrentSpace } = useSpaces();

  return (
    <SidebarMenuItem className={cn("flex flex-row gap-0.5")}>
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

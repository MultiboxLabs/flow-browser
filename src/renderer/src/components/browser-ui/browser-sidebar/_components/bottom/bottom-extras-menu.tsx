import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArchiveIcon, HistoryIcon, SettingsIcon } from "lucide-react";
import { useState } from "react";

function BottomExtraItem({
  target,
  setOpen,
  children,
  className,
  ...props
}: {
  target: string;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      onClick={() => {
        if (target === "settings_window") {
          flow.windows.openSettingsWindow();
        } else {
          flow.tabs.newTab(target, true);
        }
        setOpen(false);
      }}
      className={cn("flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function BottomExtrasMenu() {
  const [open, setOpen] = useState(false);

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10">
          <ArchiveIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-56 p-2 select-none", spaceInjectedClasses)}>
        <BottomExtraItem target="flow://history" setOpen={setOpen}>
          <HistoryIcon className="w-4 h-4" />
          <span>History</span>
        </BottomExtraItem>
        <BottomExtraItem target="settings_window" setOpen={setOpen}>
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </BottomExtraItem>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}

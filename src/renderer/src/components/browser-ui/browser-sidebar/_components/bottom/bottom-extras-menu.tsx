import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EllipsisVerticalIcon, HistoryIcon } from "lucide-react";
import { useState } from "react";

export function BottomExtrasMenu() {
  const [open, setOpen] = useState(false);

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10">
          <EllipsisVerticalIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-56 p-2 select-none", spaceInjectedClasses)}>
        <div
          onClick={() => {
            flow.tabs.newTab("flow://history", true);
            setOpen(false);
          }}
          className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm hover:bg-accent cursor-pointer"
        >
          <HistoryIcon className="w-4 h-4" />
          <span>History</span>
        </div>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}

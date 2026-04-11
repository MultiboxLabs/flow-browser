import { PortalPopover } from "@/components/portal/popover";
import { useSpaces } from "@/components/providers/spaces-provider";
import { Button } from "@/components/ui/button";
import { PopoverListboxItem, PopoverListboxList, usePopoverListbox } from "@/components/ui/popover-listbox";
import { PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArchiveIcon, HistoryIcon, SettingsIcon } from "lucide-react";
import { useCallback, useState } from "react";

const EXTRA_ITEM_COUNT = 2;

export function BottomExtrasMenu() {
  const [open, setOpen] = useState(false);

  const { isCurrentSpaceLight } = useSpaces();
  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  const onActivate = useCallback((index: number) => {
    if (index === 0) {
      flow.tabs.newTab("flow://history", true);
    } else if (index === 1) {
      flow.windows.openSettingsWindow();
    }
    setOpen(false);
  }, []);

  const listbox = usePopoverListbox({
    open,
    itemCount: EXTRA_ITEM_COUNT,
    ariaLabel: "Sidebar extras",
    getOptionId: (i) => `bottom-extra-${i}`,
    onActivate,
    initialHighlightedIndex: EXTRA_ITEM_COUNT - 1
  });

  return (
    <PortalPopover.Root open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="icon" className="size-8 bg-transparent hover:bg-black/10 dark:hover:bg-white/10">
          <ArchiveIcon strokeWidth={2} className="w-4 h-4 text-black/80 dark:text-white/80" />
        </Button>
      </PopoverTrigger>
      <PortalPopover.Content className={cn("w-56 p-2 select-none", spaceInjectedClasses)} {...listbox.contentProps}>
        <PopoverListboxList listbox={listbox}>
          <PopoverListboxItem index={0}>
            <HistoryIcon className="w-4 h-4 shrink-0" />
            <span>History</span>
          </PopoverListboxItem>
          <PopoverListboxItem index={1}>
            <SettingsIcon className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </PopoverListboxItem>
        </PopoverListboxList>
      </PortalPopover.Content>
    </PortalPopover.Root>
  );
}

import { useSpaces } from "@/components/providers/spaces-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/portal/popover";
import { cn } from "@/lib/utils";
import { EllipsisIcon, LockIcon, Settings2Icon } from "lucide-react";
import { useState } from "react";
import { useFocusedTab } from "@/components/providers/tabs-provider";
import { SiteControlExtensions } from "@/components/browser-ui/browser-sidebar/_components/site-controls/extensions";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

// Main extensions popover for the new browser UI sidebar
export function SiteControls() {
  const { isCurrentSpaceLight } = useSpaces();
  const focusedTab = useFocusedTab();
  const [open, setOpen] = useState(false);

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");

  if (!focusedTab) return null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          "size-6 flex items-center justify-center rounded-md",
          "hover:bg-black/15 dark:hover:bg-white/20",
          "transition-colors duration-150",
          "relative shrink-0"
        )}
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <div
          className={cn(
            "size-4 border rounded-[4px]",
            "border-black/80 dark:border-white/80",
            "text-black/80 dark:text-white/80",
            "flex items-center justify-center"
          )}
        >
          <Settings2Icon strokeWidth={2} className="size-3" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        variant="translucent"
        className={cn("w-60 select-none", "flex flex-col gap-3")}
        positionerClassName={spaceInjectedClasses}
      >
        {/* Extensions Section */}
        <SiteControlExtensions setOpen={setOpen} />
        <Separator />
        {/* Utilities Section */}
        <div className="flex items-center justify-between">
          <Button className={cn("justify-start rounded-md", "text-white h-8", "bg-white/5 hover:bg-white/10")}>
            <LockIcon className="size-4" />
            <span className="font-medium truncate">Secure</span>
          </Button>
          <Button className={cn("justify-center rounded-full", "text-white size-8", "bg-white/5 hover:bg-white/10")}>
            <EllipsisIcon className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

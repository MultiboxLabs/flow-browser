import { Button } from "@/components/ui/button";
import { SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TabData } from "~/types/tabs";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function SidebarTab({ tab, isActive }: { tab: TabData; isActive: boolean; isFocused: boolean }) {
  const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | null>(tab.faviconURL);
  const [isError, setIsError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const noFavicon = !cachedFaviconUrl || isError;

  const { open } = useSidebar();

  useEffect(() => {
    if (tab.faviconURL) {
      setCachedFaviconUrl(tab.faviconURL);
    } else {
      setCachedFaviconUrl(null);
    }

    // Reset error state when favicon url changes
    setIsError(false);
  }, [tab.faviconURL]);

  const handleClick = () => {
    if (!tab.id) return;
    flow.tabs.switchToTab(tab.id);
  };

  const handleCloseTab = (e: React.MouseEvent) => {
    if (!tab.id) return;
    e.preventDefault();
    flow.tabs.closeTab(tab.id);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button
    if (e.button === 1) {
      handleCloseTab(e);
    }

    setIsPressed(true);
  };

  return (
    <MotionSidebarMenuButton
      key={tab.id}
      onClick={handleClick}
      className={cn(isActive && "bg-white/5", "hover:bg-white/10 active:bg-white/15")}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isPressed ? 0.975 : 1
      }}
      exit={{ opacity: 0, x: -10 }}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setIsPressed(false)}
      transition={{
        duration: 0.2,
        scale: { type: "spring", stiffness: 600, damping: 20 }
      }}
      layout
    >
      <div className="flex flex-row justify-between w-full h-full">
        {/* Left side */}
        <div className={cn("flex flex-row items-center gap-2 flex-1", open && "min-w-0 overflow-hidden mr-1")}>
          <motion.div className="w-4 h-4 flex-shrink-0" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
            {!noFavicon && (
              <img
                src={tab.faviconURL || undefined}
                alt={tab.title}
                className="size-full"
                onError={() => setIsError(true)}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
              />
            )}
            {noFavicon && <div className="size-full bg-muted-foreground/10 dark:bg-muted-foreground/25 rounded-sm" />}
          </motion.div>
          <span className="truncate min-w-0 flex-1">{tab.title}</span>
        </div>
        {/* Right side */}
        <div className={cn("flex flex-row items-center gap-2 rounded-md aspect-square", open && "flex-shrink-0")}>
          {/* Close tab button */}
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCloseTab}
              className="size-5 bg-transparent hover:!bg-sidebar-border"
            >
              <XIcon className="size-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </MotionSidebarMenuButton>
  );
}

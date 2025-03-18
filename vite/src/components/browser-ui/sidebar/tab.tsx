import { useBrowser } from "@/components/main/browser-context";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function SidebarTab({ tab }: { tab: chrome.tabs.Tab }) {
  const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | undefined>(tab.favIconUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const noFavicon = !cachedFaviconUrl || isLoading || isError;

  const { activeTab, handleTabClick, handleTabClose } = useBrowser();

  useEffect(() => {
    if (tab.favIconUrl) {
      setCachedFaviconUrl(tab.favIconUrl);
      setIsLoading(true);
    } else {
      setCachedFaviconUrl(undefined);
      setIsLoading(false);
    }

    // Reset error state when favicon url changes
    setIsError(false);
  }, [tab.favIconUrl]);

  const handleClick = () => {
    if (!tab.id) return;
    handleTabClick(tab.id);
  };

  const handleCloseTab = (e: React.MouseEvent) => {
    if (!tab.id) return;
    e.preventDefault();
    handleTabClose(tab.id, e);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button
    if (e.button === 1) {
      handleCloseTab(e);
    }

    setIsPressed(true);
  };

  return (
    <AnimatePresence initial={true}>
      <MotionSidebarMenuButton
        key={tab.id}
        onClick={handleClick}
        className={cn("select-none", activeTab?.id === tab.id && "bg-sidebar-accent")}
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
          <div className="flex flex-row items-center gap-2">
            <motion.div className="w-4 h-4" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              {tab.favIconUrl && (
                <img
                  src={tab.favIconUrl}
                  alt={tab.title}
                  className="size-full"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsError(true)}
                  onClick={handleClick}
                  onMouseDown={handleMouseDown}
                />
              )}
              {noFavicon && <div className="size-full bg-muted-foreground/10 dark:bg-muted-foreground/25 rounded-sm" />}
            </motion.div>
            <span className="truncate">{tab.title}</span>
          </div>
          {/* Right side */}
          <div className="flex flex-row items-center gap-2 rounded-md aspect-square">
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
    </AnimatePresence>
  );
}

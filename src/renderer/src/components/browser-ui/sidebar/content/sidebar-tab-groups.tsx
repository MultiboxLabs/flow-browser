import { Button } from "@/components/ui/button";
import { SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { cn } from "@/lib/utils";
import { XIcon, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TabGroup } from "@/components/providers/tabs-provider";
import { TabData } from "~/types/tabs";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function SidebarTab({ tab, isFocused }: { tab: TabData; isFocused: boolean }) {
  const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | null>(tab.faviconURL);
  const [isError, setIsError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const noFavicon = !cachedFaviconUrl || isError;

  const isMuted = tab.muted;
  const isPlayingAudio = tab.audible;

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
    // Left mouse button
    if (e.button === 0) {
      handleClick();
    }
    // Middle mouse button
    if (e.button === 1) {
      handleCloseTab(e);
    }

    setIsPressed(true);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: function for muting/unmuting
    console.log("Toggle mute for tab:", tab.id);
    // In the future this would call: flow.tabs.toggleMute(tab.id);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    flow.tabs.showContextMenu(tab.id);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setIsPressed(false);
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <MotionSidebarMenuButton
      key={tab.id}
      onContextMenu={handleContextMenu}
      className={cn(
        "bg-transparent active:bg-transparent",
        !isFocused && "hover:bg-black/5 hover:dark:bg-white/10",
        !isFocused && "active:bg-black/10 active:dark:bg-white/20",
        isFocused && "bg-white dark:bg-white/25",
        "text-gray-900 dark:text-gray-200",
        "transition-colors"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isPressed ? 0.985 : 1
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
        {/* Normal layout */}
        <>
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
              {noFavicon && <div className="size-full bg-gray-300 dark:bg-gray-500/30 rounded-sm" />}
            </motion.div>
            <span className="truncate min-w-0 flex-1 font-medium">{tab.title}</span>
          </div>
          {/* Right side */}
          <div className={cn("flex flex-row items-center gap-2 rounded-md aspect-square", open && "flex-shrink-0")}>
            {/* Audio indicator */}
            {(isPlayingAudio || isMuted) && (
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleToggleMute}
                  className="size-5 bg-transparent hover:!bg-white dark:hover:!bg-white/10 text-gray-600 dark:text-gray-400"
                  title={isMuted ? "Unmute tab" : "Mute tab"}
                >
                  {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </Button>
              </motion.div>
            )}
            {/* Close tab button */}
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseTab}
                className="size-5 bg-transparent rounded-sm hover:bg-black/10 dark:hover:bg-white/10"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <XIcon className="size-4 text-muted-foreground dark:text-white" />
              </Button>
            </motion.div>
          </div>
        </>
      </div>
    </MotionSidebarMenuButton>
  );
}

export function SidebarTabGroups({
  tabGroup,
  isFocused
}: {
  tabGroup: TabGroup;
  isActive: boolean; // isActive might still be needed depending on parent component logic
  isFocused: boolean;
}) {
  const { tabs, focusedTab } = tabGroup;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      layout
      className="space-y-0.5" // Removed split mode specific padding and background
    >
      {tabs.map((tab) => (
        <SidebarTab key={tab.id} tab={tab} isFocused={isFocused && focusedTab?.id === tab.id} />
      ))}
    </motion.div>
  );
}

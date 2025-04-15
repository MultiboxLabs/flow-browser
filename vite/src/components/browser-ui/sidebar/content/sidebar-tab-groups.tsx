import { Button } from "@/components/ui/button";
import { SidebarMenuButton, useSidebar } from "@/components/ui/resizable-sidebar";
import { cn } from "@/lib/utils";
import { XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { TabGroup } from "@/components/providers/tabs-provider";
import { TabData } from "~/types/tabs";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { TabGroupMode } from "~/types/tabs";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function SidebarTab({
  tab,
  isFocused,
  mode,
  frontTab
}: {
  tab: TabData;
  isFocused: boolean;
  mode: TabGroupMode;
  isFrontTab?: boolean;
  frontTab?: TabData;
}) {
  const [cachedFaviconUrl, setCachedFaviconUrl] = useState<string | null>(tab.faviconURL);
  const [frontFaviconUrl, setFrontFaviconUrl] = useState<string | null>(frontTab?.faviconURL || null);
  const [isError, setIsError] = useState(false);
  const [isFrontError, setIsFrontError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const noFavicon = !cachedFaviconUrl || isError;
  const noFrontFavicon = !frontFaviconUrl || isFrontError;

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

  useEffect(() => {
    if (frontTab?.faviconURL) {
      setFrontFaviconUrl(frontTab.faviconURL);
    } else {
      setFrontFaviconUrl(null);
    }
    // Reset error state when favicon url changes
    setIsFrontError(false);
  }, [frontTab?.faviconURL]);

  const handleClick = () => {
    if (!tab.id) return;
    flow.tabs.switchToTab(tab.id);
  };

  const handleFrontTabClick = () => {
    if (!frontTab?.id) return;
    flow.tabs.switchToTab(frontTab.id);
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

  // Apply different styles based on tab group mode
  const getTabStyle = () => {
    switch (mode) {
      case "split":
        return isFocused ? "ring-1 ring-blue-300/40 dark:ring-blue-400/20 bg-white dark:bg-white/5" : "";
      case "normal":
        return isFocused ? "bg-white dark:bg-white/10" : "";
      case "glance":
        // Only one style for glance mode since we're only showing the back tab
        return "bg-white dark:bg-white/5";
      default:
        return isFocused ? "ring-1 ring-gray-300 dark:ring-white/10" : "";
    }
  };

  // For glance mode, we handle the front tab's favicon differently
  const handleFrontTabFaviconClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (frontTab?.id) {
      flow.tabs.switchToTab(frontTab.id);
    }
  };

  const renderFrontTabIcon = () => {
    if (!frontTab) return null;

    if (!noFrontFavicon) {
      return (
        <img
          src={frontTab.faviconURL || undefined}
          alt={frontTab.title}
          className="size-full rounded-full"
          onError={() => setIsFrontError(true)}
          onClick={handleFrontTabClick}
          title={frontTab.title}
        />
      );
    }

    return <div className="size-full bg-indigo-300/70 dark:bg-indigo-400/30 rounded-full" />;
  };

  return (
    <MotionSidebarMenuButton
      key={tab.id}
      onClick={handleClick}
      className={cn(
        SIDEBAR_HOVER_COLOR,
        getTabStyle(),
        "text-gray-900 dark:text-gray-200 hover:!bg-white dark:hover:!bg-white/10"
      )}
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
        {/* Content layout depends on mode */}
        {mode === "glance" && frontTab ? (
          // Glance mode - show back tab with front tab's favicon on right
          <>
            {/* Left side (back tab) */}
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
            {/* Right side (front tab favicon) */}
            <div className={cn("flex flex-row items-center gap-2", open && "flex-shrink-0")}>
              {/* Close tab button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTab}
                  className="size-5 bg-transparent hover:!bg-white dark:hover:!bg-white/10 text-gray-600 dark:text-gray-400"
                >
                  <XIcon className="size-4" />
                </Button>
              </motion.div>
              {/* Front tab favicon */}
              <motion.div
                className="w-5 h-5 flex-shrink-0 ring-1 ring-gray-300 dark:ring-white/10 rounded-full bg-white dark:bg-white/5 p-0.5"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFrontTabFaviconClick}
              >
                {renderFrontTabIcon()}
              </motion.div>
            </div>
          </>
        ) : (
          // Normal and Split modes - standard layout
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
              {/* Close tab button */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCloseTab}
                  className="size-5 bg-transparent hover:!bg-white dark:hover:!bg-white/10 text-gray-600 dark:text-gray-400"
                >
                  <XIcon className="size-4" />
                </Button>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </MotionSidebarMenuButton>
  );
}

// Extended TabGroup type with glanceFrontTabId
interface GlanceTabGroup extends TabGroup {
  glanceFrontTabId?: number;
}

export function SidebarTabGroups({
  tabGroup,
  isFocused
}: {
  tabGroup: TabGroup;
  isActive: boolean;
  isFocused: boolean;
}) {
  const { tabs, focusedTab, mode } = tabGroup;
  const glanceFrontTabId = mode === "glance" ? (tabGroup as GlanceTabGroup).glanceFrontTabId : undefined;

  // For glance mode, we need to separate front and back tabs
  let displayTabs = tabs;
  let frontTab: TabData | undefined;

  if (mode === "glance" && glanceFrontTabId) {
    // Find the front tab
    frontTab = tabs.find((tab) => tab.id === glanceFrontTabId);
    // Only display back tabs in glance mode
    displayTabs = tabs.filter((tab) => tab.id !== glanceFrontTabId);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      layout
      className={cn("space-y-0.5", mode === "split" && "p-1 rounded-md bg-white/90 dark:bg-white/5")}
    >
      {displayTabs.map((tab) => (
        <SidebarTab
          key={tab.id}
          tab={tab}
          isFocused={isFocused && focusedTab?.id === tab.id}
          mode={mode || "normal"}
          frontTab={mode === "glance" ? frontTab : undefined}
        />
      ))}
    </motion.div>
  );
}

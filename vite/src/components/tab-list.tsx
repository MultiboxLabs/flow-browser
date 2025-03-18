import React, { useRef, memo, useEffect } from "react";
import Tab from "./tab";
import { PlusIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useBrowser } from "@/components/main/browser-context";

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  onTabClick: (tabId: number) => void;
  onTabClose: (tabId: number, event: React.MouseEvent) => void;
  onCreateTab: () => void;
}

const TabList: React.FC<TabListProps> = ({ tabs, onTabClick, onTabClose, onCreateTab }) => {
  const tabListRef = useRef<HTMLUListElement>(null);

  // Log for debugging
  console.log("TabList render:", {
    tabsCount: tabs.length,
    tabIds: tabs.map((t) => t.id),
    activeTabs: tabs.filter((t) => t.active).map((t) => t.id)
  });

  // Scroll to active tab when tabs change
  useEffect(() => {
    const activeTab = tabs.find((tab) => tab.active);
    if (activeTab && tabListRef.current) {
      const activeTabElement = tabListRef.current.querySelector(`[data-tab-id="${activeTab.id}"]`);
      if (activeTabElement) {
        activeTabElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [tabs]);

  const { currentWindow } = useBrowser();

  return (
    <div className="w-full h-8 min-h-[calc(env(titlebar-area-height)+1px)]">
      <div className="fixed left-[env(titlebar-area-x)] top-[env(titlebar-area-y)] w-[env(titlebar-area-width)] h-8 min-h-[calc(env(titlebar-area-height)+1px)] flex flex-row">
        {/* Tab List */}
        <ul ref={tabListRef} className="h-full flex flex-row min-w-0 overflow-x-none">
          <AnimatePresence initial={false}>
            {tabs.map((tab) => {
              // If tab is not in this window, don't render it
              if (tab.windowId !== currentWindow?.id) {
                return null;
              }

              return (
                <Tab
                  key={`tab-${tab.id}`}
                  id={tab.id ?? -1}
                  title={tab.title}
                  favIconUrl={tab.favIconUrl}
                  isLoading={tab.status === "loading"}
                  audible={tab.audible}
                  active={tab.active}
                  onTabClick={onTabClick}
                  onTabClose={onTabClose}
                />
              );
            })}
          </AnimatePresence>
        </ul>

        {/* Create Tab Button */}
        <motion.button
          className="bg-transparent border-none text-muted-foreground font-bold font-mono hover:bg-accent/30 w-6 flex items-center justify-center"
          onClick={onCreateTab}
          title="New Tab"
          aria-label="Create new tab"
          whileHover={{ scale: 1.1, backgroundColor: "rgba(255, 255, 255, 0.1)" }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.1 }}
        >
          <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
        </motion.button>

        {/* App Drag Area */}
        <div className="flex-1 h-[calc(100%-5px)] min-w-8 self-end app-drag"></div>
      </div>
    </div>
  );
};

// Use custom comparison function to prevent unnecessary re-renders
export default memo(TabList);

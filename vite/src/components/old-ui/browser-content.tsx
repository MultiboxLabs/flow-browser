import React, { memo } from "react";
import { motion, AnimatePresence } from "motion/react";

interface BrowserContentProps {
  activeTabId?: number;
}

const BrowserContent: React.FC<BrowserContentProps> = ({ activeTabId }) => {
  // Log for debugging
  console.log("BrowserContent render", { activeTabId });

  return (
    <div className="flex-1 bg-background text-foreground border-t border-border relative">
      <AnimatePresence mode="wait">
        {activeTabId && activeTabId > 0 ? (
          // This is where the browser view would be rendered
          // In a real implementation, this would be a webview or custom element
          <motion.div
            key={`webview-container-${activeTabId}`}
            id={`webview-container-${activeTabId}`}
            className="w-full h-full"
            data-active-tab-id={activeTabId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* The actual webview would be injected here by the browser */}
          </motion.div>
        ) : (
          <motion.div
            key="no-tab"
            className="w-full h-full flex items-center justify-center text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            No active tab
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);

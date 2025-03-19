import { memo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useBrowser } from "@/components/main/browser-context";
import { PageBounds, setPageBounds } from "@/lib/flow";

const DEBUG_SHOW_BOUNDS = false;

function BrowserContent() {
  const { activeTabId } = useBrowser();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<PageBounds>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Initialize dimensions
    updateDimensions();

    // Set up ResizeObserver to track size changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    resizeObserver.observe(container);

    // Track position changes with scroll and layout changes
    window.addEventListener("scroll", updateDimensions);
    window.addEventListener("resize", updateDimensions);

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
      window.removeEventListener("scroll", updateDimensions);
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  // Function to update dimensions and position
  const updateDimensions = () => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    setDimensions({
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height
    });
  };

  useEffect(() => {
    setPageBounds(dimensions);
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-background text-foreground border-t border-border relative rounded-lg remove-app-drag"
    >
      {DEBUG_SHOW_BOUNDS && (
        <div className="absolute top-2 right-2 z-50 text-xs text-muted-foreground bg-background/80 p-1 rounded">
          x: {dimensions.x.toFixed(0)}, y: {dimensions.y.toFixed(0)}, w: {dimensions.width.toFixed(0)}, h:{" "}
          {dimensions.height.toFixed(0)}
        </div>
      )}

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
}

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);

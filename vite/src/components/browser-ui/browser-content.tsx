import { memo, useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PageBounds } from "@/lib/flow/types";
import { cn } from "@/lib/utils";

const DEBUG_SHOW_BOUNDS = false;

function BrowserContent() {
  const activeTabId = -1;
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
    flow.page.setPageBounds(dimensions);
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 -foreground border-t border-border relative rounded-lg shadow-md shadow-black/10 ring-1 ring-black/5 remove-app-drag",
        "bg-white/5",
        activeTabId > 0 && "bg-transparent border-0 ring-0 shadow-none"
      )}
    >
      {DEBUG_SHOW_BOUNDS && (
        <div className="absolute top-2 right-2 z-50 text-xs text-muted-foreground bg-background/80 p-1 rounded">
          x: {dimensions.x.toFixed(0)}, y: {dimensions.y.toFixed(0)}, w: {dimensions.width.toFixed(0)}, h:{" "}
          {dimensions.height.toFixed(0)}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeTabId && activeTabId > 0 && (
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
        )}
      </AnimatePresence>
    </div>
  );
}

// Use memo to prevent unnecessary re-renders
export default memo(BrowserContent);

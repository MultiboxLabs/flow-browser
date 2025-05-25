import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const WINDOWS_CONTROL_BUTTON_CLASSES =
  "h-7 w-8 flex items-center justify-center transition-colors duration-150 rounded-sm remove-app-drag";

function WindowsClose() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className="stroke-gray-700 dark:stroke-gray-300 transition-colors duration-150"
      strokeWidth="1"
    >
      <path d="M0.5 0.5 L9.5 9.5 M9.5 0.5 L0.5 9.5" />
    </svg>
  );
}

function WindowsMaximize({ isMaximized }: { isMaximized: boolean }) {
  if (isMaximized) {
    // Restore/unmaximize icon - two rectangles without overlap
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className="fill-none stroke-gray-700 dark:stroke-gray-300"
        strokeWidth="1"
      >
        {/* Back rectangle - only top and right lines */}
        <path d="M2 0.5 L9.5 0.5 M9.5 0.5 L9.5 8" />
        {/* Front rectangle */}
        <rect x="0.5" y="2" width="7.5" height="7.5" />
      </svg>
    );
  }

  // Maximize icon - single rectangle
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className="fill-none stroke-gray-700 dark:stroke-gray-300"
      strokeWidth="1"
    >
      <rect x="0.5" y="0.5" width="9" height="9" />
    </svg>
  );
}

function WindowsMinimize() {
  return (
    <svg width="10" height="1" viewBox="0 0 10 1" className="fill-gray-700 dark:fill-gray-300">
      <rect width="10" height="1" />
    </svg>
  );
}

export function SidebarWindowControls() {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef);

  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    let updated = false;
    flow.interface.getWindowState().then((state) => {
      if (!updated) {
        setIsMaximized(state.isMaximized);
        setIsFullscreen(state.isFullscreen);
      }
    });

    const removeListener = flow.interface.onWindowStateChanged((state) => {
      setIsMaximized(state.isMaximized);
      setIsFullscreen(state.isFullscreen);
      updated = true;
    });
    return () => {
      removeListener();
    };
  }, []);

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.x,
        y: titlebarBounds.y
      });
    }
  }, [titlebarBounds]);

  useEffect(() => {
    // Set window buttons visibility
    flow.interface.setWindowButtonVisibility(true);

    return () => {
      flow.interface.setWindowButtonVisibility(false);
    };
  }, []);

  const handleMinimize = () => {
    flow.interface.minimizeWindow();
  };

  const handleMaximize = () => {
    flow.interface.maximizeWindow();
  };

  const handleClose = () => {
    flow.interface.closeWindow();
  };

  return (
    <>
      <div
        ref={titlebarRef}
        className={cn(
          "h-2 w-full",
          "flex items-center",
          "platform-darwin:mb-2 platform-darwin:mt-0.5 platform-darwin:mx-1",
          "platform-win32:h-6 platform-linux:h-6",
          "justify-end app-drag",
          isFullscreen && "hidden"
        )}
      >
        {/* Windows & Linux Window Controls */}
        {/* Optimized for Windows, used for Linux until we make a custom design for it */}
        <div className="hidden platform-win32:flex platform-linux:flex items-center gap-1">
          {/* Minimize Button */}
          <button
            onClick={handleMinimize}
            className={cn(WINDOWS_CONTROL_BUTTON_CLASSES, "hover:bg-gray-200/20 dark:hover:bg-gray-700/50")}
            title="Minimize"
          >
            <WindowsMinimize />
          </button>

          {/* Maximize Button */}
          <button
            onClick={handleMaximize}
            className={cn(WINDOWS_CONTROL_BUTTON_CLASSES, "hover:bg-gray-200/20 dark:hover:bg-gray-700/50")}
            title="Maximize"
          >
            <WindowsMaximize isMaximized={isMaximized} />
          </button>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className={cn(
              WINDOWS_CONTROL_BUTTON_CLASSES,
              "hover:bg-red-500 dark:hover:bg-red-500 [&:hover_svg]:stroke-white"
            )}
            title="Close"
          >
            <WindowsClose />
          </button>
        </div>
      </div>
    </>
  );
}

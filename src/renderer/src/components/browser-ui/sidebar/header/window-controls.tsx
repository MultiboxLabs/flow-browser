import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { SidebarSide } from "../../main";

const WINDOWS_CONTROL_BUTTON_CLASSES =
  "h-8 w-9 flex items-center justify-center transition-colors duration-150";

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

function WindowsMaximize() {
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
    <svg
      width="10"
      height="1"
      viewBox="0 0 10 1"
      className="fill-gray-700 dark:fill-gray-300"
    >
      <rect width="10" height="1" />
    </svg>
  );
}

export function SidebarWindowControls({}: { side: SidebarSide }) {
  const titlebarRef = useRef<HTMLDivElement>(null);
  const titlebarBounds = useBoundingRect(titlebarRef);

  useEffect(() => {
    if (titlebarBounds) {
      flow.interface.setWindowButtonPosition({
        x: titlebarBounds.x,
        y: titlebarBounds.y,
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
          "h-8 w-full",
          "flex items-center",
          "platform-darwin:mb-2 platform-darwin:mt-0.5 platform-darwin:mx-1",
          "platform-win32:h-6",
          "justify-end"
        )}
      >
        {/* Minimize Button */}
        <button
          onClick={handleMinimize}
          className={cn(
            WINDOWS_CONTROL_BUTTON_CLASSES,
            "hover:bg-gray-200/20 dark:hover:bg-gray-600/20"
          )}
          title="Minimize"
        >
          <WindowsMinimize />
        </button>

        {/* Maximize Button */}
        <button
          onClick={handleMaximize}
          className={cn(
            WINDOWS_CONTROL_BUTTON_CLASSES,
            "hover:bg-gray-200/20 dark:hover:bg-gray-600/20"
          )}
          title="Maximize"
        >
          <WindowsMaximize />
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
    </>
  );
}

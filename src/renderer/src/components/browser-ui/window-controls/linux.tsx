import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const CONTROL_BUTTON_CLASSES =
  "h-7 w-8 flex items-center justify-center transition-colors duration-150 rounded-sm remove-app-drag";

function CloseIcon() {
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

function MaximizeIcon({ isMaximized }: { isMaximized: boolean }) {
  if (isMaximized) {
    return (
      <svg
        width="10"
        height="10"
        viewBox="0 0 10 10"
        className="fill-none stroke-gray-700 dark:stroke-gray-300"
        strokeWidth="1"
      >
        <path d="M2 0.5 L9.5 0.5 M9.5 0.5 L9.5 8" />
        <rect x="0.5" y="2" width="7.5" height="7.5" />
      </svg>
    );
  }

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

function MinimizeIcon() {
  return (
    <svg width="10" height="1" viewBox="0 0 10 1" className="fill-gray-700 dark:fill-gray-300">
      <rect width="10" height="1" />
    </svg>
  );
}

export function WindowControlsLinux() {
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

  if (isFullscreen) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => flow.interface.minimizeWindow()}
        className={cn(CONTROL_BUTTON_CLASSES, "hover:bg-gray-200/20 dark:hover:bg-gray-700/50")}
        title="Minimize"
      >
        <MinimizeIcon />
      </button>

      <button
        onClick={() => flow.interface.maximizeWindow()}
        className={cn(CONTROL_BUTTON_CLASSES, "hover:bg-gray-200/20 dark:hover:bg-gray-700/50")}
        title={isMaximized ? "Restore" : "Maximize"}
      >
        <MaximizeIcon isMaximized={isMaximized} />
      </button>

      <button
        onClick={() => flow.interface.closeWindow()}
        className={cn(CONTROL_BUTTON_CLASSES, "hover:bg-red-500 dark:hover:bg-red-500 [&:hover_svg]:stroke-white")}
        title="Close"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

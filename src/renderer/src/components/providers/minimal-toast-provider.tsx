/* eslint-disable @typescript-eslint/no-explicit-any */
import { PortalComponent } from "@/components/portal/portal";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { ViewLayer } from "~/layers";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { SidebarSide } from "@/components/browser-ui/types";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";

// TYPES //
interface ToastConfiguration<T extends any[]> {
  generate: (...args: T) => ToastGenerateData;
}
interface ToastGenerateData {
  message: string;
  duration: number;
}

type ToastId = keyof typeof TOAST_CONFIGURATIONS;

interface ActiveToast {
  uid: string;
  message: string;
  duration: number;
}

// CONFIGURATION //
const TOAST_WIDTH = 220;
const TOAST_HEIGHT = 46;
const TOAST_PADDING = 8;
const TOAST_CONFIGURATIONS = {
  copyTabUrl: {
    generate: () => ({
      message: "Copied Current URL",
      duration: 4500
    })
  }
} satisfies Record<string, ToastConfiguration<any[]>>;

// CONTEXT //
type ToastContextType = {
  showToast: <T extends ToastId>(
    toastId: T,
    ...args: Parameters<(typeof TOAST_CONFIGURATIONS)[T]["generate"]>
  ) => string;
  removeToast: (toastUID: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// PROVIDER //
interface ToastProviderProps {
  children: React.ReactNode;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  sidebarSide: SidebarSide;
}

function ToastContainer({
  activeToast,
  anchorRef,
  sidebarSide,
  onRemoveToast
}: {
  activeToast: ActiveToast | null;
  anchorRef: React.RefObject<HTMLDivElement | null>;
  sidebarSide: SidebarSide;
  onRemoveToast: (toastUID: string) => void;
}) {
  const { isCurrentSpaceLight } = useSpaces();
  const [isVisible, setIsVisible] = useState(false);
  const anchorRect = useBoundingRect(anchorRef);
  const currentMessage = activeToast?.message ?? null;
  const activeToastRef = useRef(activeToast);

  activeToastRef.current = activeToast;

  useEffect(() => {
    if (!activeToast) return;
    setIsVisible(true);
  }, [activeToast]);

  useEffect(() => {
    if (!activeToast) return;

    const timer = window.setTimeout(() => {
      onRemoveToast(activeToast.uid);
    }, activeToast.duration);

    return () => window.clearTimeout(timer);
  }, [activeToast, onRemoveToast]);

  if (!anchorRect) {
    return null;
  }

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");
  return (
    <PortalComponent
      visible={isVisible}
      zIndex={ViewLayer.OVERLAY}
      className="fixed"
      style={{
        top: anchorRect.y,
        ...(sidebarSide === "left"
          ? { right: window.innerWidth - anchorRect.right + TOAST_PADDING }
          : { left: anchorRect.x + TOAST_PADDING }),
        width: TOAST_WIDTH,
        height: TOAST_HEIGHT + TOAST_PADDING
      }}
    >
      <div className={cn("relative w-full h-full select-none", spaceInjectedClasses)}>
        <AnimatePresence
          mode="sync"
          onExitComplete={() => {
            if (!activeToastRef.current) {
              setIsVisible(false);
            }
          }}
        >
          {currentMessage && activeToast && (
            <motion.div
              key={activeToast.uid}
              initial={{ y: 0, opacity: 0, scale: 0.92 }}
              animate={{ y: TOAST_PADDING, opacity: 1, scale: 1 }}
              exit={{
                opacity: 0,
                scale: 0.95,
                transition: { duration: 0.15, ease: [0.4, 0, 1, 1] }
              }}
              style={{
                transformOrigin: "top center",
                position: "absolute",
                left: 0,
                right: 0,
                height: TOAST_HEIGHT
              }}
              transition={{
                type: "spring",
                stiffness: 440,
                damping: 28,
                opacity: { duration: 0.15, ease: "easeOut" }
              }}
              className={cn(
                "box-border overflow-hidden",
                "flex items-center",
                "border border-gray-800/50 dark:border-gray-300/50 rounded-lg",
                "dimmed-space-background-start"
              )}
              onClick={() => onRemoveToast(activeToast.uid)}
            >
              <span className="text-white/90 text-center text-[13px] font-medium tracking-[-0.01em] truncate flex-1 leading-none">
                {currentMessage}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalComponent>
  );
}

export function MinimalToastProvider({ children, anchorRef, sidebarSide }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ActiveToast[]>([]);

  const removeToast = useCallback((toastUID: string) => {
    setToasts((prev) => prev.filter((t) => t.uid !== toastUID));
  }, []);

  const showToast = <T extends ToastId>(
    toastId: T,
    ...args: Parameters<(typeof TOAST_CONFIGURATIONS)[T]["generate"]>
  ) => {
    type GenerateFunction = (...args: Parameters<(typeof TOAST_CONFIGURATIONS)[T]["generate"]>) => ToastGenerateData;

    const configuration = TOAST_CONFIGURATIONS[toastId];
    const generateToastData = configuration.generate as GenerateFunction;
    const { message, duration } = generateToastData(...args);
    const uid = crypto.randomUUID();
    setToasts((prev) => [...prev, { uid, message, duration }]);
    return uid;
  };

  const activeToast = toasts.length > 0 ? toasts[toasts.length - 1]! : null;
  if (activeToast && toasts.length > 1) {
    for (const toast of toasts) {
      if (toast.uid === activeToast.uid) continue;
      removeToast(toast.uid);
    }
  }

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <ToastContainer
        activeToast={activeToast}
        anchorRef={anchorRef}
        sidebarSide={sidebarSide}
        onRemoveToast={removeToast}
      />
    </ToastContext.Provider>
  );
}

export default MinimalToastProvider;

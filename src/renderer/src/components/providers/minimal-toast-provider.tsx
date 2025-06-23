import { PortalComponent } from "@/components/portal/portal";
import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SidebarSide } from "@/components/browser-ui/main";
import { cn } from "@/lib/utils";
import { useSpaces } from "@/components/providers/spaces-provider";

type ToastContextType = {
  showToast: (msg: string, duration?: number) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
  sidebarSide: SidebarSide;
}

function ToastContainer({
  currentMessage,
  sidebarSide,
  removeToast
}: {
  currentMessage: string | null;
  sidebarSide: SidebarSide;
  removeToast: () => void;
}) {
  const { isCurrentSpaceLight } = useSpaces();

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!currentMessage) return;

    setIsVisible(true);
  }, [currentMessage]);

  const spaceInjectedClasses = cn(isCurrentSpaceLight ? "" : "dark");
  return (
    <PortalComponent
      visible={isVisible}
      className="absolute"
      style={{
        top: 0,
        ...(sidebarSide === "left" ? { right: "0vw" } : { left: "0vw" }),
        width: "10%",
        height: "6%"
      }}
    >
      <div
        className={cn(
          "w-screen h-screen absolute pt-4 select-none",
          sidebarSide === "left" ? "pr-4" : "pl-4",
          spaceInjectedClasses
        )}
      >
        <AnimatePresence onExitComplete={() => setIsVisible(false)}>
          {currentMessage && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{ transformOrigin: "top" }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="box-border border border-border dimmed-space-background-start rounded-lg w-full h-full flex items-center justify-center"
              onClick={removeToast}
            >
              <span className="text-black dark:text-white text-sm font-bold">{currentMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PortalComponent>
  );
}

export function MinimalToastProvider({ children, sidebarSide }: ToastProviderProps) {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const removeToast = () => {
    // Remove timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    // Remove message
    setCurrentMessage(null);
  };

  const showToast = (msg: string, duration = 3000) => {
    removeToast();

    const removeMessageFirst = !!currentMessage;

    if (removeMessageFirst) {
      setCurrentMessage(null);
    }
    setTimeout(
      () => {
        setCurrentMessage(msg);
        timeoutIdRef.current = setTimeout(() => {
          removeToast();
        }, duration);
      },
      removeMessageFirst ? 100 : 0
    );
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer currentMessage={currentMessage} sidebarSide={sidebarSide} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

export default MinimalToastProvider;

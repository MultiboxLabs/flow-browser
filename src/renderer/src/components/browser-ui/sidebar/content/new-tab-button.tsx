import { motion } from "motion/react";
import { useState } from "react";
import { SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { PlusIcon } from "lucide-react";
import { SIDEBAR_HOVER_COLOR } from "@/components/browser-ui/browser-sidebar";
import { cn } from "@/lib/utils";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function NewTabButton() {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleNewTab = () => {
    flow.newTab.open();
  };

  return (
    <MotionSidebarMenuButton
      onClick={handleNewTab}
      animate={{
        scale: isPressed ? 0.975 : 1
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={() => setIsPressed(false)}
      transition={{
        scale: { type: "spring", stiffness: 600, damping: 20 }
      }}
      className={cn(SIDEBAR_HOVER_COLOR, "text-black/50 dark:text-muted-foreground")}
    >
      <PlusIcon className="size-4" strokeWidth={3} />
      <span className="font-medium">New Tab</span>
    </MotionSidebarMenuButton>
  );
}

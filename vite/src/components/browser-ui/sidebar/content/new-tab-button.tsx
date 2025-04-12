import { motion } from "motion/react";
import { useState } from "react";
import { SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { PlusIcon } from "lucide-react";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

export function NewTabButton() {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleNewTab = () => {
    // TODO: Implement new tab
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
      className="hover:bg-white/5 active:bg-white/10"
    >
      <PlusIcon className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">New Tab</span>
    </MotionSidebarMenuButton>
  );
}

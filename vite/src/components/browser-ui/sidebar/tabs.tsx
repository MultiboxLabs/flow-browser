import { SidebarTab } from "@/components/browser-ui/sidebar/tab";
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton
} from "@/components/ui/resizable-sidebar";
import { useBrowser } from "@/components/main/browser-context";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { showOmnibox } from "@/lib/flow";
import { getNewTabMode } from "@/lib/omnibox";

const MotionSidebarMenuButton = motion(SidebarMenuButton);

function NewTabButton() {
  const { handleCreateTab } = useBrowser();
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleNewTab = () => {
    getNewTabMode().then((newTabMode) => {
      if (newTabMode === "omnibox") {
        showOmnibox(null, null);
      } else {
        handleCreateTab();
      }
    });
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
    >
      <PlusIcon className="size-4 text-muted-foreground" />
      <span className="text-muted-foreground">New Tab</span>
    </MotionSidebarMenuButton>
  );
}

export function SidebarTabs() {
  const { tabs, handleCloseAllTabs } = useBrowser();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Tabs</SidebarGroupLabel>
      <SidebarGroupAction onClick={handleCloseAllTabs}>
        <Trash2Icon className="size-1.5 m-1 text-muted-foreground" />
      </SidebarGroupAction>
      <SidebarMenu>
        <NewTabButton />
        <AnimatePresence initial={true}>
          {tabs.map((tab) => <SidebarTab key={tab.id} tab={tab} />).reverse()}
        </AnimatePresence>
      </SidebarMenu>
    </SidebarGroup>
  );
}

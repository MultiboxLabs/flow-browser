import { SidebarTab } from "@/components/browser-ui/sidebar/tab";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton } from "@/components/ui/resizable-sidebar";
import { useBrowser } from "@/components/main/browser-context";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
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
    if (getNewTabMode() === "omnibox") {
      showOmnibox(null, null);
    } else {
      handleCreateTab();
    }
  };

  return (
    <MotionSidebarMenuButton
      className="select-none"
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
  const { tabs } = useBrowser();

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="select-none">Tabs</SidebarGroupLabel>
      <SidebarMenu>
        <NewTabButton />
        {tabs.map((tab) => <SidebarTab key={tab.id} tab={tab} />).reverse()}
      </SidebarMenu>
    </SidebarGroup>
  );
}

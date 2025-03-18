import React, { memo } from "react";
import TabList from "./tab-list";
import Toolbar from "./toolbar";
import WindowControls from "./window-controls";

interface BrowserHeaderProps {
  tabs: chrome.tabs.Tab[];
  addressUrl: string;
  onTabClick: (tabId: number) => void;
  onTabClose: (tabId: number, event: React.MouseEvent) => void;
  onCreateTab: () => void;
  onAddressChange: (url: string) => void;
  onAddressSubmit: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const BrowserHeader: React.FC<BrowserHeaderProps> = ({
  tabs,
  addressUrl,
  onTabClick,
  onTabClose,
  onCreateTab,
  onAddressChange,
  onAddressSubmit,
  onGoBack,
  onGoForward,
  onReload,
  onMinimize,
  onMaximize,
  onClose
}) => {
  // Log props for debugging
  console.log("BrowserHeader render:", {
    tabsCount: tabs.length,
    addressUrl,
    activeTabs: tabs.filter((t) => t.active).map((t) => t.id)
  });

  return (
    <div className="bg-muted border-b border-border">
      {/* Tabstrip */}
      <div className="flex flex-row justify-between">
        <TabList tabs={tabs} onTabClick={onTabClick} onTabClose={onTabClose} onCreateTab={onCreateTab} />
        <WindowControls onMinimize={onMinimize} onMaximize={onMaximize} onClose={onClose} />
      </div>

      {/* Toolbar */}
      <Toolbar
        addressUrl={addressUrl}
        onAddressChange={onAddressChange}
        onAddressSubmit={onAddressSubmit}
        onGoBack={onGoBack}
        onGoForward={onGoForward}
        onReload={onReload}
      />
    </div>
  );
};

// Use custom comparison function to prevent unnecessary re-renders
export default memo(BrowserHeader);

import React, { memo } from "react";
import NavigationControls from "./navigation-controls";
import AddressBar from "./address-bar";

interface ToolbarProps {
  addressUrl: string;
  onAddressChange: (url: string) => void;
  onAddressSubmit: () => void;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  addressUrl,
  onAddressChange,
  onAddressSubmit,
  onGoBack,
  onGoForward,
  onReload
}) => {
  // Log for debugging
  console.log("Toolbar render:", { addressUrl });

  return (
    <div className="h-7.5 bg-accent/20 text-accent-foreground flex items-center px-2 py-1">
      {/* Page Controls */}
      <NavigationControls onGoBack={onGoBack} onGoForward={onGoForward} onReload={onReload} />

      {/* Address Bar */}
      <AddressBar url={addressUrl} onChange={onAddressChange} onSubmit={onAddressSubmit} />

      {/* Browser Actions */}
      {/* @ts-expect-error - Custom injected element */}
      <browser-action-list id="actions" alignment="bottom left" />
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(Toolbar);

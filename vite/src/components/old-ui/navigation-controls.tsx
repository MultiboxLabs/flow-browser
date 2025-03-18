import React, { memo } from "react";
import { ArrowLeftIcon, ArrowRightIcon, RefreshCwIcon } from "lucide-react";

interface NavigationControlsProps {
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
}

function NavigationButton({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className="border-none w-6 h-6 p-0 flex items-center justify-center bg-transparent hover:bg-accent/30 rounded-sm"
      onClick={onClick}
      style={{ padding: 0 }}
    >
      {icon}
    </button>
  );
}

const NavigationControls: React.FC<NavigationControlsProps> = ({ onGoBack, onGoForward, onReload }) => {
  // Log for debugging
  console.log("NavigationControls render");

  return (
    <div className="mr-2 flex flex-row gap-1">
      <NavigationButton
        icon={<ArrowLeftIcon className="text-accent-foreground w-4 h-4" strokeWidth={2.5} />}
        onClick={onGoBack}
      />
      <NavigationButton
        icon={<ArrowRightIcon className="text-accent-foreground w-4 h-4" strokeWidth={2.5} />}
        onClick={onGoForward}
      />
      <NavigationButton
        icon={<RefreshCwIcon className="text-accent-foreground w-4 h-4" strokeWidth={2.5} />}
        onClick={onReload}
      />
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
const MemorizedNavigationControls = memo(NavigationControls);
export default MemorizedNavigationControls;

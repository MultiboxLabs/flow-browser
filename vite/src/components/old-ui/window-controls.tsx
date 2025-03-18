import React, { memo } from "react";

interface WindowControlsProps {
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
}

const WindowControls: React.FC<WindowControlsProps> = ({ onMinimize, onMaximize, onClose }) => {
  // Log for debugging
  console.log("WindowControls render");

  return (
    <div className="hidden platform-linux:flex flex-row flex-none">
      <button className="w-10 bg-none border-none text-muted-foreground hover:bg-accent/30" onClick={onMinimize}>
        🗕
      </button>
      <button className="w-10 bg-none border-none text-muted-foreground hover:bg-accent/30" onClick={onMaximize}>
        🗖
      </button>
      <button className="w-10 bg-none border-none text-muted-foreground hover:bg-destructive/70" onClick={onClose}>
        🗙
      </button>
    </div>
  );
};

// Use memo to prevent unnecessary re-renders
export default memo(WindowControls);

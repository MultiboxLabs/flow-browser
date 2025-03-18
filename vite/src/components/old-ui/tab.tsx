import { Loader2 } from "lucide-react";
import React, { memo } from "react";
import { motion } from "motion/react";

interface TabProps {
  id: number;
  title?: string;
  favIconUrl?: string;
  isLoading?: boolean;
  audible?: boolean;
  active?: boolean;
  onTabClick: (tabId: number) => void;
  onTabClose: (tabId: number, event: React.MouseEvent) => void;
}

const Tab: React.FC<TabProps> = ({ id, title, favIconUrl, audible, active, isLoading, onTabClick, onTabClose }) => {
  // Log for debugging
  console.log("Tab render:", { id, title, active });

  return (
    <motion.li
      data-tab-id={id}
      className={`px-2 py-1 h-full overflow-hidden flex flex-nowrap items-center w-48 border-r border-border ${
        active ? "bg-card/90 text-accent-foreground" : "bg-muted text-muted-foreground hover:bg-muted/50"
      }`}
      onClick={() => {
        onTabClick(id);
      }}
      onMouseDown={(e) => {
        // Middle mouse button
        if (e.button === 1) {
          e.preventDefault();
          onTabClose(id, e);
        }
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: active ? 1.02 : 1,
        backgroundColor: active ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"
      }}
      exit={{ opacity: 0, x: -10, scale: 0.95 }}
      transition={{
        duration: 0.2,
        scale: { duration: 0.15 },
        backgroundColor: { duration: 0.2 }
      }}
      layout
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
    >
      {isLoading && (
        <div className="w-4 h-4 mr-1">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      {!isLoading && favIconUrl && (
        <img
          src={favIconUrl}
          className="w-4 h-4 mr-1"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
          onLoad={(e) => ((e.target as HTMLImageElement).style.display = "block")}
          alt=""
        />
      )}
      <span className="whitespace-nowrap flex-1 min-w-0 text-ellipsis overflow-hidden text-xs select-none">
        {title || "New Tab"}
      </span>
      <div className="flex-none text-0">
        {audible && (
          <button className="bg-accent/20 border-none rounded-full p-0 ml-1 w-4 h-4 text-accent-foreground text-xs align-middle leading-0">
            🔊
          </button>
        )}
        <button
          className="bg-transparent border-none rounded-full p-0 ml-1 w-4 h-4 text-muted-foreground text-xs align-middle leading-0 hover:bg-destructive hover:text-destructive-foreground"
          onClick={(e) => onTabClose(id, e)}
        >
          ✕
        </button>
      </div>
    </motion.li>
  );
};

export default memo(Tab);

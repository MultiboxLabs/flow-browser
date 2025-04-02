import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getLucideIcon } from "@/lib/utils";
import type { Space } from "@/lib/flow";

// ==============================
// Space Card Component
// ==============================
interface SpaceCardProps {
  space: Space;
  activateEdit: () => void;
}

export function SpaceCard({ space, activateEdit }: SpaceCardProps) {
  const [SpaceIcon, setSpaceIcon] = useState<React.ComponentType<{ className?: string }> | null>(null);

  useEffect(() => {
    async function loadIcon() {
      try {
        if (space.icon) {
          const icon = await getLucideIcon(space.icon);
          setSpaceIcon(() => icon);
        } else {
          // Default icon if none is set
          const icon = await getLucideIcon("Globe");
          setSpaceIcon(() => icon);
        }
      } catch (error) {
        console.error("Failed to load icon:", error);
      }
    }

    loadIcon();
  }, [space.icon]);

  return (
    <motion.div
      key={space.id}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex items-center border rounded-lg p-4 cursor-pointer hover:border-primary/50"
      onClick={() => activateEdit()}
    >
      <div
        className="h-10 w-10 rounded-full mr-3 flex items-center justify-center"
        style={{
          background:
            space.bgStartColor && space.bgEndColor
              ? `linear-gradient(to bottom right, ${space.bgStartColor}, ${space.bgEndColor})`
              : "var(--muted)"
        }}
      >
        {SpaceIcon && <SpaceIcon className="size-8 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{space.name}</h3>
        <p className="text-xs text-muted-foreground truncate">ID: {space.id}</p>
      </div>
    </motion.div>
  );
}

import { motion } from "motion/react";
import type { Space } from "~/flow/interfaces/sessions/spaces";
import { SpaceIcon } from "@/lib/phosphor-icons";

// ==============================
// Space Card Component
// ==============================
interface SpaceCardProps {
  space: Space;
  activateEdit: () => void;
}

export function SpaceCard({ space, activateEdit }: SpaceCardProps) {
  return (
    <motion.div
      key={space.id}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className="flex items-center border rounded-lg p-4 cursor-pointer hover:border-primary/50 bg-card"
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
        <SpaceIcon id={space.icon} className="size-6 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-base truncate">{space.name}</h3>
        <p className="text-xs text-muted-foreground truncate">ID: {space.id}</p>
      </div>
    </motion.div>
  );
}

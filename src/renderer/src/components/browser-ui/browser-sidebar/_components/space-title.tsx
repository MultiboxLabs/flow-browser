import { Space } from "~/flow/interfaces/sessions/spaces";
import { SpaceIcon } from "@/lib/phosphor-icons";
import { cn } from "@/lib/utils";

export function SpaceTitle({ space }: { space: Space | null }) {
  if (!space) return null;

  return (
    <div className={cn("flex flex-row gap-1.5 items-center", "w-full h-4", "px-2 mt-2.5 mb-1")}>
      <SpaceIcon
        fallbackId={undefined}
        id={space.icon}
        strokeWidth={2.5}
        className="space-icon-color dark:text-white! size-4.5"
      />
      <span className="font-bold text-black/50 dark:text-white/50 h-5 leading-5 text-sm">{space.name}</span>
    </div>
  );
}

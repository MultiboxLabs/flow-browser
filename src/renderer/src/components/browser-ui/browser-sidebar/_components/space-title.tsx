import { Space } from "~/flow/interfaces/sessions/spaces";
import { SpaceIcon } from "@/lib/phosphor-icons";
import { cn } from "@/lib/utils";

export function SpaceTitle({ space }: { space: Space | null }) {
  if (!space) return null;

  return (
    <div className={cn("flex flex-row gap-2 items-center", "w-full h-9", "px-1 py-2.5")}>
      <SpaceIcon
        fallbackId={undefined}
        id={space.icon}
        strokeWidth={2.5}
        className="space-icon-color dark:text-white! size-4.5"
      />
      <span className="font-bold text-black/50 dark:text-white/50 h-5 text-[13px]">{space.name}</span>
    </div>
  );
}

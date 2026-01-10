import { cn } from "@/lib/utils";

export function PinnedTabButton({ faviconUrl, isActive }: { faviconUrl: string; isActive: boolean }) {
  return (
    <div
      className={cn(
        "w-full h-12 rounded-xl overflow-hidden",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center justify-center",
        isActive && "border-2 border-white"
      )}
    >
      <div
        id="overlay"
        className={cn("size-full", "flex items-center justify-center", isActive && "bg-white/80 dark:bg-white/30")}
      >
        <div className="relative size-6">
          <img
            src={faviconUrl || undefined}
            className="absolute rounded-sm user-drag-none object-contain overflow-hidden"
          />
          <div className="img-container">
            <img src={faviconUrl || undefined} className="user-drag-none" />
          </div>
        </div>
      </div>
    </div>
  );
}

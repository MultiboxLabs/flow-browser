import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";

export function AddressBar() {
  const isPlaceholder = true;

  return (
    <div
      className={cn(
        "w-full h-9 rounded-xl",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center p-2 px-3 gap-1.5",
        isPlaceholder ? "text-white/60" : "text-white"
      )}
    >
      <SearchIcon strokeWidth={2} className="h-4" />
      <p className={cn("font-[inter] text-sm font-medium truncate")}>
        {isPlaceholder ? "Search or Enter URL..." : "w3schools.com"}
      </p>
    </div>
  );
}

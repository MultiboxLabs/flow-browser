import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { memo, useCallback, useRef } from "react";
import { useTabs } from "@/components/providers/tabs-provider";
import { simplifyUrl } from "@/lib/url";

export const AddressBar = memo(function AddressBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { addressUrl, focusedTab } = useTabs();

  const simplifiedUrl = simplifyUrl(addressUrl);
  const isPlaceholder = !simplifiedUrl;

  const handleClick = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    flow.omnibox.show(
      {
        x: rect.x,
        y: rect.y,
        width: rect.width * 2,
        height: rect.height * 8
      },
      {
        currentInput: addressUrl,
        openIn: focusedTab ? "current" : "new_tab"
      }
    );
  }, [addressUrl, focusedTab]);

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "w-full h-9 rounded-xl select-none",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center p-2 px-3 gap-1.5",
        isPlaceholder ? "text-black/60 dark:text-white/60" : "text-black dark:text-white"
      )}
    >
      {isPlaceholder && <SearchIcon strokeWidth={2} className="h-4" />}
      <p className={cn("font-[inter] text-sm font-medium truncate")}>
        {isPlaceholder ? "Search or Enter URL..." : simplifiedUrl}
      </p>
    </div>
  );
});

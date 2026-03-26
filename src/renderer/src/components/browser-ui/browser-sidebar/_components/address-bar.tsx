import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { memo, useCallback, useRef, type MouseEvent } from "react";
import { useAddressUrl, useFocusedTabId } from "@/components/providers/tabs-provider";
import { simplifyUrl } from "@/lib/url";
import { PinnedBrowserActions } from "./pinned-browser-actions";
import { BrowserActionList } from "@/components/browser-ui/browser-sidebar/_components/browser-action-list";

export const AddressBar = memo(function AddressBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const addressUrl = useAddressUrl();
  const focusedTabId = useFocusedTabId();

  const simplifiedUrl = simplifyUrl(addressUrl);
  const isPlaceholder = !simplifiedUrl;

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;

      const path = event.nativeEvent.composedPath();
      if (!path.includes(el)) {
        return;
      }

      flow.omnibox.show(null, {
        currentInput: addressUrl,
        openIn: focusedTabId ? "current" : "new_tab"
      });
    },
    [addressUrl, focusedTabId]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "w-full min-w-0 h-9 rounded-xl select-none",
        "bg-black/10 hover:bg-black/15",
        "dark:bg-white/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center p-2 px-3 gap-1 overflow-hidden",
        isPlaceholder ? "text-black/60 dark:text-white/60" : "text-black dark:text-white"
      )}
    >
      {isPlaceholder && <SearchIcon strokeWidth={2} className="h-3.5 shrink-0" />}
      <p className={cn("font-[inter] text-sm font-medium min-w-0 flex-1 truncate")}>
        {isPlaceholder ? "Search or Enter URL..." : simplifiedUrl}
      </p>
      <div className="ml-auto flex items-center gap-0.5 shrink-0">
        <PinnedBrowserActions />
        <div>
          <BrowserActionList />
        </div>
      </div>
    </div>
  );
});

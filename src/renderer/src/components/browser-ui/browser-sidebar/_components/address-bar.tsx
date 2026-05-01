import { cn } from "@/lib/utils";
import { SearchIcon } from "lucide-react";
import { memo, useCallback, useRef, type MouseEvent } from "react";
import { useAddressUrl, useFocusedTabId } from "@/components/providers/tabs-provider";
import { simplifyUrl } from "@/lib/url";
import { PinnedBrowserActions } from "./pinned-browser-actions";
import { BrowserActionList } from "@/components/browser-ui/browser-sidebar/_components/browser-action-list";
import { useBrowserSidebar } from "@/components/browser-ui/browser-sidebar/provider";

export const AddressBar = memo(function AddressBar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const addressUrl = useAddressUrl();
  const focusedTabId = useFocusedTabId();
  const { hasSidebar } = useBrowserSidebar();

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

      const rect = el.getBoundingClientRect();

      // If it is in a popup window, do not show the omnibox
      const isPopupWindow = !hasSidebar;
      if (isPopupWindow) {
        return;
      }

      flow.omnibox.show(
        {
          x: rect.x,
          y: rect.y,
          width: rect.width * 1.8,
          height: rect.height * 8
        },
        {
          currentInput: addressUrl,
          openIn: focusedTabId ? "current" : "new_tab"
        }
      );
    },
    [addressUrl, focusedTabId, hasSidebar]
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn(
        "w-full min-w-0 h-9 rounded-xl select-none",
        "bg-black/10 dark:bg-white/15",
        hasSidebar && "hover:bg-black/15 dark:hover:bg-white/20",
        "transition-[background-color] duration-100",
        "flex items-center p-2 px-3 gap-1 overflow-hidden",
        isPlaceholder ? "text-black/50 dark:text-white/50" : "text-black/80 dark:text-white/80"
      )}
    >
      {isPlaceholder && <SearchIcon strokeWidth={2} className="h-3.5 shrink-0" />}
      <p className={cn("text-sm font-medium min-w-0 flex-1 truncate")}>
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

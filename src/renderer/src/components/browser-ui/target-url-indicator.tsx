import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { PortalComponent } from "@/components/portal/portal";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useSpaces } from "@/components/providers/spaces-provider";
import { useTabs } from "@/components/providers/tabs-provider";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";
import type { TabTargetUrlUpdate } from "~/types/tabs";
import { AnimatePresence, motion } from "motion/react";

const PADDING = 8;
const BAR_HEIGHT = 28;

/**
 * Must match inherited UI text: `:root` in `src/renderer/src/index.css` sets
 * `system-ui, Avenir, Helvetica, Arial, sans-serif` — Inter is bundled but is
 * not the default body font. `text-xs` → 12px; `font-semibold` → 600.
 */
const TARGET_URL_INDICATOR_FONT = "600 12px system-ui, Avenir, Helvetica, Arial, sans-serif";

/** Horizontal padding (`px-2` × 2) + border (1px × 2). */
const TARGET_URL_HORIZONTAL_CHROME_PX = 16 + 2;

interface TargetUrlIndicatorProps {
  anchorRef: React.RefObject<HTMLDivElement | null>;
}

function stripHttpProtocol(url: string): string {
  return url.replace(/^https?:\/\//i, "");
}

// If there is no current url, show URL after 1 seeconds
// If there is a current url, switch to new url instantly
// If there is a current url and new url is empty, wait 1 seconds and then switch to empty url
function useDelayedUrl(url: string = ""): string {
  const [showing, setShowing] = useState(false);

  const lastUrl = useRef("");
  const newUrl = url.trim();
  if (newUrl !== "") {
    lastUrl.current = stripHttpProtocol(newUrl);
  }

  const timerRef = useRef<{ timeout: NodeJS.Timeout; type: "show" | "hide" } | null>(null);
  const removeTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current.timeout);
    }
    timerRef.current = null;
  }, []);
  useEffect(() => {
    if (!showing && newUrl) {
      if (!timerRef.current || timerRef.current.type !== "show") {
        removeTimer();
        const timeout = setTimeout(() => {
          setShowing(true);
        }, 500);
        timerRef.current = { timeout, type: "show" };
      }
    } else if (showing && !newUrl) {
      if (!timerRef.current || timerRef.current.type !== "hide") {
        removeTimer();
        const timeout = setTimeout(() => {
          setShowing(false);
        }, 500);
        timerRef.current = { timeout, type: "hide" };
      }
    } else {
      removeTimer();
    }
  }, [newUrl, showing, removeTimer]);

  return showing ? lastUrl.current : "";
}

/**
 * Chrome-like hover URL preview at the bottom-left of the browser content area.
 * Uses PortalComponent so it stacks above the tab WebContentsView (same pattern as FindInPage).
 */
export function TargetUrlIndicator({ anchorRef }: TargetUrlIndicatorProps) {
  const { tabsData, getFocusedTabId } = useTabs();
  const { currentSpace } = useSpaces();
  const [urlsByTabId, setUrlsByTabId] = useState(() => new Map<number, string>());

  const anchorRect = useBoundingRect(anchorRef);

  useEffect(() => {
    return flow.tabs.onTargetUrlChanged((update: TabTargetUrlUpdate) => {
      setUrlsByTabId((prev) => {
        const next = new Map(prev);
        if (update.url) {
          next.set(update.tabId, update.url);
        } else {
          next.delete(update.tabId);
        }
        return next;
      });
    });
  }, []);

  useEffect(() => {
    if (!tabsData) return;
    const validIds = new Set(tabsData.tabs.map((t) => t.id));
    setUrlsByTabId((prev) => {
      let changed = false;
      const next = new Map(prev);
      for (const id of next.keys()) {
        if (!validIds.has(id)) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tabsData]);

  const focusedTabId = currentSpace ? getFocusedTabId(currentSpace.id) : null;
  const currentUrl = focusedTabId != null ? urlsByTabId.get(focusedTabId) : undefined;
  const url = useDelayedUrl(currentUrl);

  const portalStyle = useMemo((): CSSProperties | null => {
    if (!anchorRect || !url) return null;

    const prepared = prepareWithSegments(url, TARGET_URL_INDICATOR_FONT);
    const textWidth = measureNaturalWidth(prepared);
    const naturalBarWidth = Math.ceil(textWidth + TARGET_URL_HORIZONTAL_CHROME_PX);
    const maxWidth = anchorRect.width * 0.6;
    const barWidth = Math.min(naturalBarWidth, maxWidth);
    if (barWidth <= 0) return null;

    return {
      left: anchorRect.left + PADDING,
      bottom: window.innerHeight - anchorRect.bottom + PADDING,
      width: barWidth,
      height: BAR_HEIGHT
    };
  }, [anchorRect, url]);
  const lastPortalStyle = useRef<CSSProperties | null>(null);
  if (portalStyle) {
    lastPortalStyle.current = portalStyle;
  }

  const [urlPresent, setUrlPresent] = useState(false);
  useEffect(() => {
    if (url) {
      setUrlPresent(true);
    }
  }, [url]);
  const isVisible = !!(urlPresent && lastPortalStyle);
  return (
    <PortalComponent
      visible={isVisible}
      zIndex={ViewLayer.OVERLAY}
      className="fixed"
      style={lastPortalStyle.current ?? {}}
    >
      <AnimatePresence onExitComplete={() => setUrlPresent(false)}>
        {url && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: "easeInOut" }}
            className={cn(
              "pointer-events-none flex h-full w-full items-end justify-start",
              "rounded-full px-2 py-1 text-xs",
              "border border-sidebar-border/25",
              "space-background-dark text-white/80"
            )}
          >
            <span className="min-w-0 max-w-full truncate font-semibold">{url}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </PortalComponent>
  );
}

import { measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";
import { memo, useEffect, useMemo, useState, type CSSProperties } from "react";
import { PortalComponent } from "@/components/portal/portal";
import { useBoundingRect } from "@/hooks/use-bounding-rect";
import { useSpaces } from "@/components/providers/spaces-provider";
import { useTabs } from "@/components/providers/tabs-provider";
import { cn } from "@/lib/utils";
import { ViewLayer } from "~/layers";
import type { TabTargetUrlUpdate } from "~/types/tabs";

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

/**
 * Chrome-like hover URL preview at the bottom-left of the browser content area.
 * Uses PortalComponent so it stacks above the tab WebContentsView (same pattern as FindInPage).
 */
function TargetUrlIndicator({ anchorRef }: TargetUrlIndicatorProps) {
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
  const url = focusedTabId != null ? urlsByTabId.get(focusedTabId) : undefined;

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

  const isVisible = !!(url && portalStyle);
  return (
    <PortalComponent visible={isVisible} zIndex={ViewLayer.OVERLAY} className="fixed" style={portalStyle ?? {}}>
      <div
        className={cn(
          "pointer-events-none flex h-full w-full items-end justify-start",
          "rounded-full px-2 py-1 text-xs",
          "border border-sidebar-border/25",
          "space-background-dark text-white/80"
        )}
        title={url}
      >
        <span className="min-w-0 max-w-full truncate font-semibold">{url}</span>
      </div>
    </PortalComponent>
  );
}

export default memo(TargetUrlIndicator);

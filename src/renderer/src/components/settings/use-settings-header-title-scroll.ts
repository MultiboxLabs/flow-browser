import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_THRESHOLD_PX = 150;
const DEFAULT_CHROME_RANGE_PX = 64;

export function useSettingsHeaderTitleScroll({
  sectionHeaderTitleMode,
  sectionId,
  currentSectionNode,
  thresholdPx = DEFAULT_THRESHOLD_PX,
  chromeRangePx = DEFAULT_CHROME_RANGE_PX
}: {
  sectionHeaderTitleMode: "none" | "showOnScroll" | "showAlways";
  sectionId: string | null;
  currentSectionNode: ReactNode;
  thresholdPx?: number;
  chromeRangePx?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [headerTitleFromScroll, setHeaderTitleFromScroll] = useState(false);

  const updateScrollChrome = useCallback((el: HTMLDivElement) => {
    const nextOpacity = Math.min(el.scrollTop / chromeRangePx, 1);
    el.style.setProperty("--settings-scroll-mask-opacity", String(nextOpacity));
  }, [chromeRangePx]);

  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (el) {
      el.scrollTop = 0;
      el.style.setProperty("--settings-scroll-mask-opacity", "0");
    }
    setHeaderTitleFromScroll(false);
  }, [sectionId]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      updateScrollChrome(el);
      if (sectionHeaderTitleMode === "showOnScroll") {
        setHeaderTitleFromScroll(el.scrollTop > thresholdPx);
      }
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [sectionHeaderTitleMode, sectionId, currentSectionNode, thresholdPx, updateScrollChrome]);

  return { viewportRef, headerTitleFromScroll };
}

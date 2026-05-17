import { useEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_THRESHOLD_PX = 150;

export function useSettingsHeaderTitleScroll({
  sectionHeaderTitleMode,
  sectionId,
  currentSectionNode,
  thresholdPx = DEFAULT_THRESHOLD_PX
}: {
  sectionHeaderTitleMode: "none" | "showOnScroll" | "showAlways";
  sectionId: string | null;
  currentSectionNode: ReactNode;
  thresholdPx?: number;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [headerTitleFromScroll, setHeaderTitleFromScroll] = useState(false);

  useEffect(() => {
    setHeaderTitleFromScroll(false);
  }, [sectionId]);

  useEffect(() => {
    if (sectionHeaderTitleMode !== "showOnScroll") return;
    const el = viewportRef.current;
    if (!el) return;
    const onScroll = () => {
      setHeaderTitleFromScroll(el.scrollTop > thresholdPx);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [sectionHeaderTitleMode, sectionId, currentSectionNode, thresholdPx]);

  return { viewportRef, headerTitleFromScroll };
}

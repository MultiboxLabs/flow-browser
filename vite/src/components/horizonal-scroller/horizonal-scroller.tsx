import { Children, RefObject, useEffect, useRef } from "react";

interface HorizontalScrollerProps {
  children: React.ReactNode;
  overscrollPercent?: number;
  containerRef: RefObject<HTMLDivElement | null>;
  onChanged?: (index: number) => void;
  targetIndex?: number;
}

export const HorizontalScrollerContainerClasses =
  "h-full w-full overflow-x-auto flex snap-x snap-mandatory overscroll-x-contain no-scrollbar";

export function HorizontalScroller({
  children,
  overscrollPercent = 0,
  containerRef,
  onChanged,
  targetIndex
}: HorizontalScrollerProps) {
  const childArray = Children.toArray(children);
  const itemCount = childArray.length;

  // Hooks
  const lastIndexRef = useRef<number | null>(null);
  const lastTargetIndexRef = useRef<number | undefined>(undefined);
  const isUserScrollingRef = useRef(false);

  // Calculate widths based on configuration
  const totalItemsWithPadding = itemCount + 2 * overscrollPercent;
  const innerContainerWidthPercent = totalItemsWithPadding * 100;
  const itemWidthPercent = 100 / totalItemsWithPadding;
  const paddingWidthPercent = (overscrollPercent * 100) / totalItemsWithPadding;

  // Handle wheel
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleWheel = () => {
      isUserScrollingRef.current = true;
    };

    container.addEventListener("wheel", handleWheel, {
      passive: true
    });
    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef]);

  // Handle scroll
  useEffect(() => {
    const container = containerRef?.current;
    if (!container) return;

    const handleScrollEnd = () => {
      if (!isUserScrollingRef.current) return;
      isUserScrollingRef.current = false;

      const scrollLeft = container.scrollLeft;
      const containerWidth = container.offsetWidth;
      const itemWidthPixels = containerWidth;

      const currentIndex = Math.round(scrollLeft / itemWidthPixels);
      if (currentIndex !== lastIndexRef.current) {
        lastIndexRef.current = currentIndex;
        onChanged?.(currentIndex);
      }
    };

    container.addEventListener("scrollend", handleScrollEnd);
    return () => {
      container.removeEventListener("scrollend", handleScrollEnd);
    };
  }, [containerRef, onChanged, overscrollPercent]);

  // Handle target index
  useEffect(() => {
    const lastTargetIndex = lastTargetIndexRef.current;

    if (targetIndex === undefined) return;
    if (targetIndex === lastTargetIndex) return;

    const container = containerRef.current;
    if (!container) return;

    lastTargetIndexRef.current = targetIndex;

    const containerWidth = container.offsetWidth;
    const itemWidthPixels = containerWidth;
    container.scrollTo({
      left: targetIndex * itemWidthPixels,
      behavior: lastTargetIndex === undefined ? "instant" : "smooth"
    });
  }, [containerRef, targetIndex]);

  return (
    <div className="flex h-full" style={{ width: `${innerContainerWidthPercent}%` }}>
      {/* Left Padding */}
      <div className="flex-shrink-0 h-full" style={{ width: `${paddingWidthPercent}%` }} aria-hidden="true" />

      {/* Render Children */}
      {childArray.map((child, index) => (
        <div
          key={index} // Use index as key, assuming children order is stable
          className="h-full flex-shrink-0 snap-center snap-always flex items-center justify-center" // Added flex centering
          style={{ width: `${itemWidthPercent}%` }}
        >
          {child}
        </div>
      ))}

      {/* Right Padding */}
      <div className="flex-shrink-0 h-full" style={{ width: `${paddingWidthPercent}%` }} aria-hidden="true" />
    </div>
  );
}

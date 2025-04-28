import { useState, useLayoutEffect, RefObject, useCallback, useRef, useMemo } from "react";
import { usePortalContext } from "@/components/portal/portal";

export interface UseBoundingRectOptions {
  throttleMs?: number;
}

export function useBoundingRect<T extends HTMLElement>(
  ref: RefObject<T | null>,
  options: UseBoundingRectOptions = {}
): DOMRect | null {
  const { throttleMs = 0 } = options;

  const { x: portalX, y: portalY } = usePortalContext();
  const [rect, setRect] = useState<DOMRect | null>(null);
  const lastUpdateTimeRef = useRef(0);
  const pendingUpdateRef = useRef<number | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  const updateRect = useCallback(() => {
    const target = ref.current;
    if (target == null) return;

    const newRect = target.getBoundingClientRect();
    lastRectRef.current = newRect;

    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;

    if (timeSinceLastUpdate >= throttleMs) {
      // Update immediately if throttle time has passed
      setRect((prevRect) => (equals(prevRect, newRect) ? prevRect : newRect));
      lastUpdateTimeRef.current = now;
      pendingUpdateRef.current = null;
    } else if (pendingUpdateRef.current === null) {
      // Schedule update for later
      pendingUpdateRef.current = window.setTimeout(() => {
        // Apply the most recent rect
        if (lastRectRef.current) {
          setRect((prevRect) => (equals(prevRect, lastRectRef.current) ? prevRect : lastRectRef.current));
        }
        lastUpdateTimeRef.current = Date.now();
        pendingUpdateRef.current = null;
      }, throttleMs - timeSinceLastUpdate);
    }
    // If there's already a pending update, we don't need to do anything
    // The timeout will use lastRectRef.current which contains the latest values
  }, [ref, throttleMs]);

  const throttledUpdate = useCallback(() => {
    requestAnimationFrame(updateRect);
  }, [updateRect]);

  useLayoutEffect(() => {
    const target = ref.current;
    if (target == null) return;

    // Initial measurement
    updateRect();

    // Track resize changes
    const resizeObserver = new ResizeObserver(throttledUpdate);
    resizeObserver.observe(target);

    // Track DOM mutations that might affect position
    const mutationObserver = new MutationObserver(throttledUpdate);

    mutationObserver.observe(target, {
      attributes: true,
      attributeFilter: ["style", "class"]
    });

    // Track position changes by observing parent elements
    let parent = target.parentElement;
    while (parent) {
      resizeObserver.observe(parent);
      mutationObserver.observe(parent, {
        attributes: true,
        attributeFilter: ["style", "class"]
      });
      parent = parent.parentElement;
    }

    // Track viewport changes
    window.addEventListener("scroll", throttledUpdate, { capture: true, passive: true });
    window.addEventListener("resize", throttledUpdate, { passive: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();

      // Clear any pending timeouts
      if (pendingUpdateRef.current !== null) {
        clearTimeout(pendingUpdateRef.current);
      }

      // Remove window listeners
      window.removeEventListener("scroll", throttledUpdate, { capture: true });
      window.removeEventListener("resize", throttledUpdate);
    };
  }, [ref, updateRect, throttledUpdate]);

  // Combine the portal offset (if it exists) with the rect
  const finalRect = useMemo(() => {
    if (rect == null) return null;

    const x = rect.x + (portalX ?? 0);
    const y = rect.y + (portalY ?? 0);

    const width = rect.width;
    const height = rect.height;

    return new DOMRect(x, y, width, height);
  }, [rect, portalX, portalY]);
  return finalRect;
}

function equals(a: DOMRect | null, b: DOMRect | null): boolean {
  if (a == null || b == null) return false;

  const rectProps: Array<keyof DOMRect> = ["x", "y", "width", "height", "top", "right", "bottom", "left"];
  return rectProps.every((prop) => a[prop] === b[prop]);
}

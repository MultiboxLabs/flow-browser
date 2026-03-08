import { useCallback, useEffect, useRef, useState } from "react";

/** Duration (ms) to keep spring animations active after a reorder/creation.
 *  The motion spring (stiffness 500, damping 35) settles in ~200ms. */
const ANIMATION_DURATION = 300;

/**
 * Controls layout animation for the pin grid.
 *
 * Animations are OFF by default (instant repositioning) and only enabled
 * temporarily when an explicit reorder or pin-creation occurs. This prevents
 * unwanted spring animations when the sidebar resizes, collapses, or
 * transitions between hover and normal states.
 *
 * Returns:
 * - `layoutAnimationsEnabled` – whether spring transitions are active
 * - `enableAnimationsTemporarily` – call before a reorder/creation to
 *   briefly enable the spring, then auto-revert to instant
 */
export function usePinGridLayoutAnimations() {
  const [layoutAnimationsEnabled, setLayoutAnimationsEnabled] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enableAnimationsTemporarily = useCallback(() => {
    setLayoutAnimationsEnabled(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setLayoutAnimationsEnabled(false);
    }, ANIMATION_DURATION);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { layoutAnimationsEnabled, enableAnimationsTemporarily } as const;
}

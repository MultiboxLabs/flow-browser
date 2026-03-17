import { useMemo, useRef } from "react";

/** Minimum width (px) a single pin should occupy. */
const MIN_TAB_WIDTH = 60;
/** Tailwind `gap-2` = 8px. */
const GAP = 8;
/** Maximum number of columns the grid supports (must match GRID_COL_CLASSES length). */
const MAX_COLS = 5;
/** Default column count before the first measurement. */
const DEFAULT_COLS = 3;

/**
 * Static lookup so Tailwind can detect each class at build time.
 * Index 0 → 1 column, index 4 → 5 columns.
 */
const GRID_COL_CLASSES = ["grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "grid-cols-5"] as const;

/**
 * Calculates responsive column count for the pin grid based on measured width.
 *
 * Returns:
 * - `cols` – number of columns to display
 * - `colsRef` – ref always holding the latest column count (for use in
 *   long-lived closures like drag-and-drop callbacks)
 * - `gridColumnClass` – the Tailwind `grid-cols-*` class to apply
 */
export function usePinGridColumns(containerWidth: number, pinCount: number) {
  const colsRef = useRef(DEFAULT_COLS);

  const cols = useMemo(() => {
    if (containerWidth > 0) {
      const calculated = Math.max(1, Math.floor((containerWidth + GAP) / (MIN_TAB_WIDTH + GAP)));
      return calculated;
    }
    return DEFAULT_COLS;
  }, [containerWidth]);

  const effectiveCols = Math.max(1, Math.min(cols, pinCount, MAX_COLS));
  colsRef.current = effectiveCols;
  const gridColumnClass = GRID_COL_CLASSES[effectiveCols - 1] ?? "grid-cols-1";

  return { cols, colsRef, gridColumnClass } as const;
}

export type GridIndicator = { index: number; edge: "left" | "right" };

/**
 * Find the closest pin edge (left or right) to the cursor position.
 * Uses Euclidean distance from cursor to each pin's edge midpoints,
 * which naturally handles multi-row grid layouts.
 *
 * @param gridEl  The grid container element whose children are the pins.
 * @param clientX Cursor X in client coordinates.
 * @param clientY Cursor Y in client coordinates.
 * @param cols    Number of grid columns — used to avoid normalizing across rows.
 */
export function findClosestPinEdge(
  gridEl: HTMLElement,
  clientX: number,
  clientY: number,
  cols: number
): GridIndicator | null {
  const children = gridEl.children;
  if (children.length === 0) return null;

  let closestDist = Infinity;
  let result: GridIndicator | null = null;

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    const dLeft = Math.hypot(clientX - rect.left, clientY - midY);
    if (dLeft < closestDist) {
      closestDist = dLeft;
      result = { index: i, edge: "left" };
    }

    const dRight = Math.hypot(clientX - rect.right, clientY - midY);
    if (dRight < closestDist) {
      closestDist = dRight;
      result = { index: i, edge: "right" };
    }
  }

  // Normalize: "left of pin i" and "right of pin i-1" are the same gap,
  // BUT only within the same row.  Across rows the two positions are
  // visually distinct, so we must not collapse them.
  if (result && result.edge === "left" && result.index > 0 && result.index % cols !== 0) {
    result = { index: result.index - 1, edge: "right" };
  }

  return result;
}

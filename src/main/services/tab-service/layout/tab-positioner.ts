import { Tab } from "../core/tab";

/**
 * TabPositioner — manages tab ordering within a space.
 *
 * Each TabLayout has a TabPositioner, and multiple TabLayouts can share
 * the same TabPositioner in Sync Tabs mode.
 *
 * Position values are floating-point to allow insertion without rewriting
 * all positions. Normalization happens periodically or on demand.
 */
export class TabPositioner {
  /**
   * Get the smallest position among all provided tabs.
   */
  public getSmallestPosition(tabs: Tab[]): number {
    if (tabs.length === 0) return 0;
    return Math.min(...tabs.map((t) => t.position));
  }

  /**
   * Get the largest position among all provided tabs.
   */
  public getLargestPosition(tabs: Tab[]): number {
    if (tabs.length === 0) return 0;
    return Math.max(...tabs.map((t) => t.position));
  }

  /**
   * Compute a new position for inserting a tab at the top (smallest position).
   */
  public getInsertTopPosition(tabs: Tab[]): number {
    return this.getSmallestPosition(tabs) - 1;
  }

  /**
   * Compute a new position for inserting a tab at the bottom (largest position).
   */
  public getInsertBottomPosition(tabs: Tab[]): number {
    return this.getLargestPosition(tabs) + 1;
  }

  /**
   * Compute a position for inserting after a specific tab.
   */
  public getInsertAfterPosition(tab: Tab, allTabs: Tab[]): number {
    const sorted = [...allTabs].sort((a, b) => a.position - b.position);
    const index = sorted.findIndex((t) => t.id === tab.id);

    if (index === -1 || index === sorted.length - 1) {
      return tab.position + 1;
    }

    // Midpoint between current and next
    return (tab.position + sorted[index + 1].position) / 2;
  }

  /**
   * Normalize positions to be sequential integers starting from 0.
   * This prevents drift from repeated fractional insertions.
   */
  public normalizePositions(tabs: Tab[]): void {
    const sorted = [...tabs].sort((a, b) => a.position - b.position);
    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].position !== i) {
        sorted[i].updateStateProperty("position", i);
      }
    }
  }
}

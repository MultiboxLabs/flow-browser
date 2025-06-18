import { Tab } from "@/browser/tabs/tab";
import { Rectangle } from "electron";

/**
 * Helper function to compare two Rectangle objects for equality.
 * Handles null cases.
 */
export function isRectangleEqual(rect1: Rectangle | null, rect2: Rectangle | null): boolean {
  // If both are the same instance (including both null), they are equal.
  if (rect1 === rect2) {
    return true;
  }
  // If one is null and the other isn't, they are not equal.
  if (!rect1 || !rect2) {
    return false;
  }
  // Compare properties if both are non-null.
  return rect1.x === rect2.x && rect1.y === rect2.y && rect1.width === rect2.width && rect1.height === rect2.height;
}

export class TabBoundsController {
  private readonly tab: Tab;
  public bounds: Rectangle | null = null;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  /**
   * Sets the bounds if they're different from the current bounds.
   * @param bounds The desired bounds for the tab's view.
   */
  public setBounds(bounds: Rectangle): void {
    // Don't set bounds if they haven't changed
    if (isRectangleEqual(this.bounds, bounds)) {
      return;
    }

    this.bounds = { ...bounds }; // Copy to avoid external mutation
    this.updateViewBounds();
  }

  /**
   * Sets the bounds immediately.
   * @param bounds The exact bounds to apply immediately.
   */
  public setBoundsImmediate(bounds: Rectangle): void {
    this.bounds = { ...bounds }; // Create a copy
    this.updateViewBounds();
  }

  /**
   * Applies the current bounds to the actual BrowserView if the tab is visible.
   */
  private updateViewBounds(): void {
    if (!this.tab.visible || !this.bounds) {
      return;
    }

    this.tab.view.setBounds(this.bounds);
  }

  /**
   * Cleans up resources.
   */
  public destroy(): void {
    this.bounds = null;
  }
}

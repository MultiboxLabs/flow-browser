import { View, WebContentsView } from "electron";

export class ViewManager {
  private readonly parentView: View;
  private readonly views: Map<WebContentsView, number>;

  constructor(parentView: View) {
    this.parentView = parentView;
    this.views = new Map();
  }

  addOrUpdateView(view: WebContentsView, zIndex: number): void {
    this.views.set(view, zIndex);
    view.webContents.on("destroyed", () => {
      this.removeView(view, true);
    });
    this.reorderViews();
  }

  removeView(view: WebContentsView, dontRemoveFromParent: boolean = false): void {
    if (this.views.has(view)) {
      try {
        // Attempt to remove from parent, might fail if already removed
        if (!dontRemoveFromParent) {
          this.parentView.removeChildView(view);
        }
      } catch (error) {
        // Log error but continue removing from internal map
        console.warn(`Failed to remove view ${view} from parent (might be expected if already removed):`, error);
      }
      this.views.delete(view);
      // Reordering might be needed if the removed view wasn't the topmost
      // However, Electron's View API doesn't provide direct z-index control,
      // so simply removing is often sufficient unless strict visual layering
      // independent of Electron's default top-most-on-add is required.
      // For simplicity, we won't reorder on removal for now.
      // If needed, call this.reorderViews();
    }
  }

  getViewZIndex(view: WebContentsView): number | undefined {
    return this.views.get(view);
  }

  destroy(dontRemoveViews: boolean = false): void {
    // Remove all managed views from the parent
    if (!dontRemoveViews) {
      this.views.forEach((_, view) => {
        try {
          this.parentView.removeChildView(view);
        } catch (error) {
          // Log error but continue cleanup
          console.warn(`Failed to remove view ${view} during destroy:`, error);
        }
      });
    }

    // Clear the internal map
    this.views.clear();
  }

  private reorderViews(): void {
    // Sort views by zIndex, lowest first
    const sortedViews = Array.from(this.views.entries()).sort(([, aIndex], [, bIndex]) => aIndex - bIndex);

    // Add views back in order. addChildView brings the added view to the top
    // relative to its siblings managed by this parent.
    // Adding lowest zIndex first means highest zIndex will end up visually on top.
    sortedViews.forEach(([view]) => {
      try {
        // Check if view is still valid (not destroyed, etc.) - View API has no direct 'isDestroyed'
        // Rely on addChildView potentially throwing an error if the view is invalid
        this.parentView.addChildView(view);
      } catch (error) {
        console.error(`Failed to add/reorder view during reorder:`, error);
        // Attempt to find the ID for the failed view to remove it from the map
        const failedViewEntry = Array.from(this.views.entries()).find(([, zIndex]) => zIndex === zIndex);
        if (failedViewEntry) {
          console.error(`Removing view with ID ${failedViewEntry[0]} from manager due to reorder error.`);
          this.views.delete(failedViewEntry[0]);
        } else {
          console.error(`Could not find ID for the failed view during reorder.`);
        }
      }
    });
  }
}

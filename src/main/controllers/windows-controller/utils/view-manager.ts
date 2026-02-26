import { View, WebContentsView } from "electron";

export class ViewManager {
  private readonly parentView: View;
  private readonly views: Map<WebContentsView, number>;
  /** Cached sorted order of views for dirty-flag comparison */
  private sortedOrder: WebContentsView[];
  /** When true, reorderViews() calls are deferred until batching ends */
  private _batching: boolean;
  /** Tracks whether any z-index change during a batch actually changed the sort order */
  private _batchDirty: boolean;

  constructor(parentView: View) {
    this.parentView = parentView;
    this.views = new Map();
    this.sortedOrder = [];
    this._batching = false;
    this._batchDirty = false;
  }

  addOrUpdateView(view: WebContentsView, zIndex: number): void {
    const current = this.views.get(view);

    // Skip entirely if the view is already registered at the same z-index
    if (current === zIndex) return;

    this.views.set(view, zIndex);

    // Only register the destroyed listener once per view (when first added)
    if (current === undefined) {
      view.webContents.on("destroyed", () => {
        this.removeView(view, true);
      });
    }

    // Only reorder if the sorted sequence actually changed
    if (this.orderChanged(view, current)) {
      if (this._batching) {
        this._batchDirty = true;
      } else {
        this.reorderViews();
      }
    }
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
      // Update cached order
      this.sortedOrder = this.sortedOrder.filter((v) => v !== view);
    }
  }

  getViewZIndex(view: WebContentsView): number | undefined {
    return this.views.get(view);
  }

  /**
   * Batch multiple addOrUpdateView calls so that reorderViews() is called
   * at most once after all updates are applied.
   *
   * The callback runs synchronously. The view order is fully consistent
   * before batchUpdate returns — no deferred/async flush.
   */
  batchUpdate(fn: () => void): void {
    this._batching = true;
    this._batchDirty = false;
    try {
      fn();
    } finally {
      this._batching = false;
      if (this._batchDirty) {
        this._batchDirty = false;
        this.reorderViews();
      }
    }
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

    // Clear the internal state
    this.views.clear();
    this.sortedOrder = [];
  }

  /**
   * Determine whether a z-index change for `view` actually alters the
   * sorted order of views. This avoids unnecessary Electron IPC when a
   * view's z-index changes but its position in the stack doesn't.
   */
  private orderChanged(_view: WebContentsView, oldZIndex: number | undefined): boolean {
    // New view added — order always changes
    if (oldZIndex === undefined) return true;

    // Compute new sorted order and compare with cached order
    const newOrder = Array.from(this.views.entries())
      .sort(([, a], [, b]) => a - b)
      .map(([v]) => v);

    if (newOrder.length !== this.sortedOrder.length) return true;

    for (let i = 0; i < newOrder.length; i++) {
      if (newOrder[i] !== this.sortedOrder[i]) return true;
    }

    return false;
  }

  private reorderViews(): void {
    // Sort views by zIndex, lowest first
    const sortedViews = Array.from(this.views.entries()).sort(([, aIndex], [, bIndex]) => aIndex - bIndex);

    // Update cached order
    this.sortedOrder = sortedViews.map(([view]) => view);

    // Add views back in order. addChildView brings the added view to the top
    // relative to its siblings managed by this parent.
    // Adding lowest zIndex first means highest zIndex will end up visually on top.
    sortedViews.forEach(([view]) => {
      try {
        this.parentView.addChildView(view);
      } catch (error) {
        console.error(`Failed to add/reorder view during reorder:`, error);
        // Remove the failed view from the manager
        this.views.delete(view);
        this.sortedOrder = this.sortedOrder.filter((v) => v !== view);
      }
    });
  }
}

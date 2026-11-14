import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { Tab } from "./tab";
import { TabLayoutNodeMode } from "~/types/tab-service";
import type { LayerType } from "~/layers";
import type { TabLayout } from "../layout/tab-layout";

/**
 * TabLayoutNode — represents tabs displayed together in a window.
 *
 * In the old system this was "TabGroup" with modes (glance, split).
 * In the new system we explicitly define this as a "layout node" to
 * avoid confusion with folder-like tab groups.
 *
 * A single tab is represented as a layout node with mode "single".
 * Multi-tab modes include "glance" (stacked preview) and "split" (side-by-side).
 */

type TabLayoutNodeEvents = {
  "tab-added": [Tab];
  "tab-removed": [Tab];
  "front-tab-changed": [Tab | null];
  "space-changed": [oldSpaceId: string];
  changed: [];
  destroyed: [];
};

export class TabLayoutNode extends TypedEventEmitter<TabLayoutNodeEvents> {
  public readonly id: string;
  public mode: TabLayoutNodeMode;
  public isDestroyed: boolean = false;

  public windowId: number;
  public profileId: string;
  public spaceId: string;

  private _tabs: Tab[] = [];
  private _tabIdSet: Set<number> = new Set();
  private _frontTab: Tab | null = null;
  private _destroyListeners: Map<number, () => void> = new Map();

  /**
   * All layouts this node is registered in.
   * A node may belong to multiple layouts when STAW (sync tabs across windows)
   * is enabled, or for pinned tabs which exist in all profile layouts.
   */
  private _memberLayouts: Set<TabLayout> = new Set();

  /**
   * The layout where this node shows real content.
   * Other member layouts show a placeholder thumbnail.
   * Null if the node is only in one layout (default case).
   */
  private _activeLayout: TabLayout | null = null;

  constructor(id: string, mode: TabLayoutNodeMode, initialTab: Tab, windowId: number) {
    super();

    this.id = id;
    this.mode = mode;
    this.windowId = windowId;
    this.profileId = initialTab.profileId;
    this.spaceId = initialTab.spaceId;

    this.addTab(initialTab);
  }

  // --- Accessors ---

  public get tabs(): readonly Tab[] {
    return this._tabs;
  }

  public get tabIds(): number[] {
    return this._tabs.map((t) => t.id);
  }

  public get frontTab(): Tab | null {
    return this._frontTab;
  }

  public get position(): number {
    if (this._tabs.length === 0) return 0;
    return Math.min(...this._tabs.map((t) => t.position));
  }

  public get tabCount(): number {
    return this._tabs.length;
  }

  // --- Multi-Layout Membership ---

  public get memberLayouts(): ReadonlySet<TabLayout> {
    return this._memberLayouts;
  }

  public get activeLayout(): TabLayout | null {
    return this._activeLayout;
  }

  /**
   * Whether this node shows real content in the given layout,
   * or a placeholder thumbnail.
   */
  public isActiveInLayout(layout: TabLayout): boolean {
    // If no multi-layout, always active in its sole layout
    if (this._activeLayout === null) return true;
    return this._activeLayout === layout;
  }

  public addMemberLayout(layout: TabLayout): void {
    this._memberLayouts.add(layout);
    // If first layout, it's active by default
    if (this._activeLayout === null && this._memberLayouts.size === 1) {
      this._activeLayout = layout;
    }
  }

  public removeMemberLayout(layout: TabLayout): void {
    this._memberLayouts.delete(layout);
    if (this._activeLayout === layout) {
      // Fall back to first remaining layout or null
      this._activeLayout = this._memberLayouts.size > 0 ? this._memberLayouts.values().next().value! : null;
    }
  }

  /**
   * Set the active layout (shows real content). Other layouts show placeholder.
   * Emits "active-layout-changed" so the sync system can update placeholders.
   */
  public setActiveLayout(layout: TabLayout): void {
    if (!this._memberLayouts.has(layout)) return;
    if (this._activeLayout === layout) return;
    const previous = this._activeLayout;
    this._activeLayout = layout;
    this.emit("changed");
    // Update windowId to match the active layout
    this.windowId = layout.windowId;
    void previous; // previous is available for placeholder capture if needed
  }

  // --- Tab Management ---

  public hasTab(tabId: number): boolean {
    return this._tabIdSet.has(tabId);
  }

  public getTab(tabId: number): Tab | undefined {
    return this._tabs.find((t) => t.id === tabId);
  }

  public addTab(tab: Tab): boolean {
    this.checkNotDestroyed();

    if (this._tabIdSet.has(tab.id)) return false;

    this._tabs.push(tab);
    this._tabIdSet.add(tab.id);

    // Set front tab for single-tab nodes
    if (this._tabs.length === 1) {
      this._frontTab = tab;
    }

    // Sync tab to this node's space/window
    if (tab.spaceId !== this.spaceId) {
      tab.setSpace(this.spaceId);
    }

    // Listen for tab destruction (guarded + tracked for cleanup)
    const onDestroyed = () => {
      this._destroyListeners.delete(tab.id);
      if (!this.isDestroyed) this.removeTab(tab);
    };
    this._destroyListeners.set(tab.id, onDestroyed);
    tab.once("destroyed", onDestroyed);

    this.emit("tab-added", tab);
    this.emit("changed");
    return true;
  }

  public removeTab(tab: Tab): boolean {
    this.checkNotDestroyed();

    const index = this._tabs.findIndex((t) => t.id === tab.id);
    if (index === -1) return false;

    // Remove the destroy listener to prevent stale callbacks
    const listener = this._destroyListeners.get(tab.id);
    if (listener) {
      tab.off("destroyed", listener);
      this._destroyListeners.delete(tab.id);
    }

    this._tabs.splice(index, 1);
    this._tabIdSet.delete(tab.id);

    // Update front tab if needed
    if (this._frontTab?.id === tab.id) {
      this._frontTab = this._tabs[0] ?? null;
      this.emit("front-tab-changed", this._frontTab);
    }

    this.emit("tab-removed", tab);
    this.emit("changed");

    // Auto-destroy if empty
    if (this._tabs.length === 0) {
      this.destroy();
    }

    return true;
  }

  // --- Front Tab (for glance mode) ---

  public setFrontTab(tab: Tab): void {
    this.checkNotDestroyed();

    if (!this.hasTab(tab.id)) return;
    if (this._frontTab?.id === tab.id) return;

    this._frontTab = tab;
    this.emit("front-tab-changed", tab);
    this.emit("changed");
  }

  // --- Space/Window ---

  public setSpace(spaceId: string): void {
    this.checkNotDestroyed();
    if (this.spaceId === spaceId) return;

    const oldSpaceId = this.spaceId;
    this.spaceId = spaceId;
    for (const tab of this._tabs) {
      tab.setSpace(spaceId);
    }
    this.emit("space-changed", oldSpaceId);
    this.emit("changed");
  }

  public setWindowId(windowId: number): void {
    this.checkNotDestroyed();
    if (this.windowId === windowId) return;

    this.windowId = windowId;
    this.emit("changed");
  }

  // --- Bounds Calculation (secondary) ---

  /**
   * Compute bounds for each tab in this node given the main bounds from TabLayout.
   * For single-tab nodes, returns the main bounds directly.
   * For multi-tab nodes (split/glance), divides the space accordingly.
   */
  public computeBounds(mainBounds: Electron.Rectangle): Map<Tab, { bounds: Electron.Rectangle; layerType: LayerType }> {
    const result = new Map<Tab, { bounds: Electron.Rectangle; layerType: LayerType }>();

    if (this._tabs.length <= 1) {
      // Single tab: passthrough
      if (this._tabs[0]) {
        result.set(this._tabs[0], { bounds: mainBounds, layerType: "tab" });
      }
      return result;
    }

    if (this.mode === "split") {
      const count = this._tabs.length;
      const tabWidth = Math.floor(mainBounds.width / count);
      for (let i = 0; i < count; i++) {
        const width = i === count - 1 ? mainBounds.width - i * tabWidth : tabWidth;
        result.set(this._tabs[i], {
          bounds: { x: mainBounds.x + i * tabWidth, y: mainBounds.y, width, height: mainBounds.height },
          layerType: "tab"
        });
      }
      return result;
    }

    // Glance mode: front tab at 85% centered, back tabs at 95% centered
    for (let i = 0; i < this._tabs.length; i++) {
      const tab = this._tabs[i];
      const isFront = this._frontTab === tab;
      const widthPct = isFront ? 0.85 : 0.95;
      const heightPct = isFront ? 1 : 0.975;

      const newWidth = Math.floor(mainBounds.width * widthPct);
      const newHeight = Math.floor(mainBounds.height * heightPct);
      const xOffset = Math.floor((mainBounds.width - newWidth) / 2);
      const yOffset = Math.floor((mainBounds.height - newHeight) / 2);

      result.set(tab, {
        bounds: { x: mainBounds.x + xOffset, y: mainBounds.y + yOffset, width: newWidth, height: newHeight },
        layerType: isFront ? "tab" : "tabBack"
      });
    }
    return result;
  }

  // --- Lifecycle ---

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    // Clean up all destroy listeners from remaining tabs
    for (const [tabId, listener] of this._destroyListeners) {
      const tab = this._tabs.find((t) => t.id === tabId);
      if (tab) tab.off("destroyed", listener);
    }
    this._destroyListeners.clear();

    this.emit("destroyed");
    this.destroyEmitter();
  }

  private checkNotDestroyed(): void {
    if (this.isDestroyed) {
      throw new Error(`TabLayoutNode ${this.id} is already destroyed`);
    }
  }
}

import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { Tab } from "../core/tab";
import { TabLayoutNode } from "../core/tab-layout-node";
import { TabPositioner } from "./tab-positioner";
import { TabLayoutNodeMode } from "~/types/tab-service";

/**
 * TabLayout — one per window-space.
 *
 * Each TabLayout manages the layout nodes for a single space within
 * a single window. At most one layout node is active (visible) at a time.
 *
 * Responsibilities:
 * - Tracks the active layout node
 * - Tracks the focused tab (last interacted with)
 * - Manages activation history for smart tab switching on close
 * - Controls visibility of its managed nodes
 * - Delegates position management to TabPositioner
 */

type TabLayoutEvents = {
  "active-changed": [windowId: number, spaceId: string];
  "focused-tab-changed": [windowId: number, spaceId: string];
  "layout-node-created": [TabLayoutNode];
  "layout-node-destroyed": [TabLayoutNode];
  destroyed: [];
};

export class TabLayout extends TypedEventEmitter<TabLayoutEvents> {
  public readonly windowId: number;
  public readonly spaceId: string;
  public readonly positioner: TabPositioner;
  public isDestroyed: boolean = false;

  // Active layout node for this layout
  private activeNode: TabLayoutNode | null = null;
  // Focused tab (last interacted with)
  private focusedTab: Tab | null = null;
  // Activation history (layout node IDs, most recent last)
  private activationHistory: string[] = [];
  // All layout nodes in this layout
  private layoutNodes: Map<string, TabLayoutNode> = new Map();
  // Index: tabId → node (for O(1) getNodeForTab)
  private tabToNode: Map<number, TabLayoutNode> = new Map();

  private layoutNodeCounter: number = 0;

  /** Whether this layout is currently visible (its space is active in the window). */
  public visible: boolean = false;

  constructor(windowId: number, spaceId: string, positioner: TabPositioner) {
    super();
    this.windowId = windowId;
    this.spaceId = spaceId;
    this.positioner = positioner;
  }

  /**
   * Set layout visibility. When hidden, all tabs in the active node are hidden.
   * When shown, tabs in the active node are made visible.
   */
  public setVisible(visible: boolean): void {
    if (this.visible === visible) return;
    this.visible = visible;
    // Actual tab visibility is handled by updateTabVisibility in TabService
    // which reads the layout's active node state.
  }

  // --- Layout Node Management ---

  /**
   * Create a new layout node wrapping a single tab.
   */
  public createSingleNode(tab: Tab): TabLayoutNode {
    const id = this.generateNodeId();
    const node = new TabLayoutNode(id, "single", tab, this.windowId);
    this.registerNode(node);
    return node;
  }

  /**
   * Create a multi-tab layout node (glance or split).
   */
  public createMultiNode(mode: Exclude<TabLayoutNodeMode, "single">, tabs: Tab[]): TabLayoutNode | null {
    if (tabs.length < 2) return null;

    const id = this.generateNodeId();
    const node = new TabLayoutNode(id, mode, tabs[0], this.windowId);
    for (let i = 1; i < tabs.length; i++) {
      node.addTab(tabs[i]);
    }
    this.registerNode(node);
    return node;
  }

  /**
   * Get a layout node by ID.
   */
  public getNode(nodeId: string): TabLayoutNode | undefined {
    return this.layoutNodes.get(nodeId);
  }

  /**
   * Get all layout nodes in this layout (non-destroyed).
   */
  public getNodes(): TabLayoutNode[] {
    const result: TabLayoutNode[] = [];
    for (const node of this.layoutNodes.values()) {
      if (!node.isDestroyed) result.push(node);
    }
    return result;
  }

  /**
   * Find the layout node containing a specific tab.
   */
  public getNodeForTab(tabId: number): TabLayoutNode | undefined {
    return this.tabToNode.get(tabId);
  }

  /**
   * Get all layout nodes, sorted by position.
   */
  public getAllNodesSorted(): TabLayoutNode[] {
    return this.getNodes().sort((a, b) => a.position - b.position);
  }

  /**
   * Destroy a layout node and remove it from tracking.
   */
  public destroyNode(nodeId: string): void {
    const node = this.layoutNodes.get(nodeId);
    if (!node) return;

    this.layoutNodes.delete(nodeId);
    this.removeFromHistory(nodeId);

    // Clear active reference if this was active
    if (this.activeNode?.id === nodeId) {
      this.activeNode = null;
    }

    if (!node.isDestroyed) {
      node.destroy();
    }
  }

  // --- Active Node Management ---

  /**
   * Set the active layout node.
   */
  public setActiveNode(node: TabLayoutNode): void {
    this.activeNode = node;

    // Update history
    const existingIdx = this.activationHistory.indexOf(node.id);
    if (existingIdx > -1) this.activationHistory.splice(existingIdx, 1);
    this.activationHistory.push(node.id);

    // Update focused tab
    if (node.frontTab) {
      this.setFocusedTab(node.frontTab);
    }

    this.emit("active-changed", this.windowId, this.spaceId);
  }

  /**
   * Get the active layout node.
   */
  public getActiveNode(): TabLayoutNode | null {
    return this.activeNode;
  }

  /**
   * Remove active node and select next based on history/position.
   */
  public removeActiveAndSelectNext(closedPosition?: number): TabLayoutNode | null {
    this.activeNode = null;
    this.focusedTab = null;

    // Try from history
    for (let i = this.activationHistory.length - 1; i >= 0; i--) {
      const node = this.layoutNodes.get(this.activationHistory[i]);
      if (node && !node.isDestroyed && node.tabCount > 0) {
        this.setActiveNode(node);
        return node;
      }
    }

    // Fall back to position-based
    const sorted = this.getAllNodesSorted();
    if (sorted.length === 0) {
      this.emit("active-changed", this.windowId, this.spaceId);
      return null;
    }

    if (closedPosition !== undefined) {
      const next = sorted.find((n) => n.position >= closedPosition) ?? sorted[sorted.length - 1];
      this.setActiveNode(next);
      return next;
    }

    this.setActiveNode(sorted[0]);
    return sorted[0];
  }

  /**
   * Get the next/previous node without activating it.
   */
  public getAdjacentNode(delta: 1 | -1): TabLayoutNode | undefined {
    const sorted = this.getAllNodesSorted();
    if (sorted.length === 0) return undefined;
    if (sorted.length === 1) return sorted[0];

    if (!this.activeNode) return sorted[0];

    const idx = sorted.findIndex((n) => n.id === this.activeNode!.id);
    const nextIdx = (idx + delta + sorted.length) % sorted.length;
    return sorted[nextIdx];
  }

  /**
   * Check if a tab is in the currently active layout node.
   */
  public isTabActive(tab: Tab): boolean {
    if (!this.activeNode) return false;
    return this.activeNode.hasTab(tab.id);
  }

  // --- Focused Tab ---

  public setFocusedTab(tab: Tab): void {
    this.focusedTab = tab;
    this.emit("focused-tab-changed", this.windowId, this.spaceId);
  }

  public getFocusedTab(): Tab | null {
    return this.focusedTab;
  }

  public removeFocusedTab(): void {
    this.focusedTab = null;
  }

  // --- Lifecycle ---

  public destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    for (const node of this.layoutNodes.values()) {
      if (!node.isDestroyed) node.destroy();
    }
    this.layoutNodes.clear();
    this.activeNode = null;
    this.focusedTab = null;
    this.activationHistory = [];
    this.tabToNode.clear();

    this.emit("destroyed");
    this.destroyEmitter();
  }

  // --- Private ---

  private generateNodeId(): string {
    return `ln-${this.windowId}-${this.spaceId.slice(0, 8)}-${this.layoutNodeCounter++}`;
  }

  private registerNode(node: TabLayoutNode): void {
    this.layoutNodes.set(node.id, node);
    node.addMemberLayout(this);

    // Update tabToNode index
    for (const tab of node.tabs) {
      this.tabToNode.set(tab.id, node);
    }

    // Listen for tab additions/removals to maintain index
    node.on("tab-added", (tab) => {
      this.tabToNode.set(tab.id, node);
    });
    node.on("tab-removed", (tab) => {
      this.tabToNode.delete(tab.id);
    });

    node.on("destroyed", () => {
      this.layoutNodes.delete(node.id);
      this.removeFromHistory(node.id);
      node.removeMemberLayout(this);
      // Clean up index
      for (const tab of node.tabs) {
        this.tabToNode.delete(tab.id);
      }
      if (this.activeNode?.id === node.id) {
        this.activeNode = null;
      }
      this.emit("layout-node-destroyed", node);
    });

    this.emit("layout-node-created", node);
  }

  /**
   * Add an existing node to this layout (for STAW / pinned tab multi-layout membership).
   * Unlike createSingleNode, this doesn't create a new node — it registers an existing one.
   */
  public addExistingNode(node: TabLayoutNode): void {
    if (this.layoutNodes.has(node.id)) return;
    this.registerNode(node);
  }

  /**
   * Remove a node from this layout without destroying it.
   * Used when a node is being unregistered from a secondary layout.
   */
  public removeNodeWithoutDestroy(nodeId: string): void {
    const node = this.layoutNodes.get(nodeId);
    if (!node) return;

    this.layoutNodes.delete(nodeId);
    this.removeFromHistory(nodeId);
    node.removeMemberLayout(this);
    for (const tab of node.tabs) {
      this.tabToNode.delete(tab.id);
    }
    if (this.activeNode?.id === nodeId) {
      this.activeNode = null;
    }
  }

  private removeFromHistory(nodeId: string): void {
    const idx = this.activationHistory.indexOf(nodeId);
    if (idx > -1) this.activationHistory.splice(idx, 1);
  }

  // --- Bounds Calculation (main) ---

  /**
   * Compute the main bounds for this layout (the page content area).
   * This is the window's page bounds, or fullscreen content size if applicable.
   */
  public computeMainBounds(): Electron.Rectangle | null {
    const window = browserWindowsController.getWindowById(this.windowId);
    if (!window) return null;
    return window.pageBounds;
  }

  /**
   * Apply bounds to all visible tabs in the active node.
   * TabLayout computes main bounds, then delegates to TabLayoutNode.computeBounds()
   * for per-tab sub-bounds (split/glance).
   */
  public applyBounds(): void {
    const activeNode = this.activeNode;
    if (!activeNode) return;

    const window = browserWindowsController.getWindowById(this.windowId);
    if (!window) return;

    const mainBounds = window.pageBounds;

    const tabBoundsMap = activeNode.computeBounds(mainBounds);
    for (const [tab, { bounds, layerType }] of tabBoundsMap) {
      if (!tab.visible || !tab.view) continue;

      let finalBounds: Electron.Rectangle;
      if (tab.fullScreen) {
        const [contentWidth, contentHeight] = window.browserWindow.getContentSize();
        finalBounds = { x: 0, y: 0, width: contentWidth, height: contentHeight };
      } else {
        finalBounds = bounds;
      }

      tab.setLayerType(layerType);
      tab.view.setBounds(finalBounds);
      tab.view.setBorderRadius(tab.fullScreen ? 0 : 6);
    }
  }
}

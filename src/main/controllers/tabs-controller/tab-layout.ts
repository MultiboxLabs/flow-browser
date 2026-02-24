import { Tab } from "./tab";
import { TabBoundsController, isRectangleEqual } from "./bounds";
import { TabLifecycleManager } from "./tab-lifecycle";
import { getCurrentTimestamp } from "@/modules/utils";
import { TabGroupMode } from "~/types/tabs";
import { Rectangle } from "electron";
import { type TabsController } from "./index";

// Z-index constants
const GLANCE_FRONT_ZINDEX = 3;
export const TAB_ZINDEX = 2;
const GLANCE_BACK_ZINDEX = 0;

/**
 * Manages tab layout: bounds calculation, visibility, z-index positioning.
 *
 * Design notes:
 * - Reads tab state but only mutates it through tab.updateStateProperty()
 * - Uses TabBoundsController for spring-physics bounds animation
 * - Needs a reference to TabsController to query tab group membership
 *   (one-way dependency: layout -> controller, never controller -> layout)
 * - Needs a reference to TabLifecycleManager for wake-on-show and PiP transitions
 */
export class TabLayoutManager {
  private lastTabGroupMode: TabGroupMode | null = null;
  private lastBorderRadius: number | null = null;

  constructor(
    private readonly tab: Tab,
    private readonly tabsController: TabsController,
    private readonly boundsController: TabBoundsController,
    private readonly lifecycleManager: TabLifecycleManager
  ) {}

  /**
   * Shows the tab (sets visible = true and updates layout).
   */
  show(): void {
    const updated = this.tab.updateStateProperty("visible", true);
    if (!updated) return; // Already visible
    this.updateLayout();
  }

  /**
   * Hides the tab (sets visible = false and updates layout).
   */
  hide(): void {
    const updated = this.tab.updateStateProperty("visible", false);
    if (!updated) return; // Already hidden
    this.updateLayout();
  }

  /**
   * Full layout update for the tab. Handles:
   * - Visibility sync with the WebContentsView
   * - PiP enter/exit on visibility transitions
   * - Wake-on-show for sleeping tabs
   * - Bounds calculation based on tab group mode (normal/glance/split)
   * - Z-index management
   * - Spring-animated bounds transitions
   */
  updateLayout(): void {
    const { tab, tabsController, boundsController } = this;
    const { visible } = tab;
    const window = tab.getWindow();

    // Sync view visibility
    const wasVisible = tab.view.getVisible();
    if (wasVisible !== visible) {
      tab.view.setVisible(visible);

      // Handle PiP transitions on visibility change
      if (visible) {
        this.lifecycleManager.exitPictureInPicture();
      } else {
        this.lifecycleManager.enterPictureInPicture();
      }
    }

    // Update lastActiveAt on visibility transitions
    const justHidden = wasVisible && !visible;
    const justShown = !wasVisible && visible;
    if (justHidden || justShown) {
      tab.updateStateProperty("lastActiveAt", getCurrentTimestamp());
    }

    if (!visible) return;

    // Update extensions on show
    if (justShown) {
      const extensions = tab.loadedProfile.extensions;
      extensions.selectTab(tab.webContents);
    }

    // Auto-wake sleeping tabs when they become visible
    this.lifecycleManager.wakeUp();

    // Get base bounds and fullscreen state
    const pageBounds = window.pageBounds;
    const borderRadius = tab.fullScreen ? 0 : 8;
    if (borderRadius !== this.lastBorderRadius) {
      tab.view.setBorderRadius(borderRadius);
      this.lastBorderRadius = borderRadius;
    }

    // Determine tab group mode and calculate bounds
    const tabGroup = tabsController.getTabGroupByTabId(tab.id);
    const lastTabGroupMode = this.lastTabGroupMode;
    let newBounds: Rectangle | null = null;
    let newTabGroupMode: TabGroupMode | null = null;
    let zIndex = TAB_ZINDEX;

    if (!tabGroup) {
      newTabGroupMode = "normal";
      newBounds = pageBounds;
    } else if (tabGroup.mode === "glance") {
      newTabGroupMode = "glance";
      const isFront = tabGroup.frontTabId === tab.id;
      newBounds = this.calculateGlanceBounds(pageBounds, isFront);

      zIndex = isFront ? GLANCE_FRONT_ZINDEX : GLANCE_BACK_ZINDEX;
    } else if (tabGroup.mode === "split") {
      newTabGroupMode = "split";
      // TODO: Implement split tab group layout
    }

    // Update z-index via setWindow
    tab.setWindow(window, zIndex);

    // Track mode changes
    if (newTabGroupMode !== lastTabGroupMode) {
      this.lastTabGroupMode = newTabGroupMode;
    }

    // Apply calculated bounds with spring animation
    if (newBounds) {
      const useImmediateUpdate =
        newTabGroupMode === lastTabGroupMode &&
        isRectangleEqual(boundsController.bounds, boundsController.targetBounds);

      if (useImmediateUpdate) {
        boundsController.setBoundsImmediate(newBounds);
      } else {
        boundsController.setBounds(newBounds);
      }
    }
  }

  /**
   * Calculates bounds for a tab in glance mode.
   * Front tab is slightly smaller; back tab is larger but behind.
   */
  private calculateGlanceBounds(pageBounds: Rectangle, isFront: boolean): Rectangle {
    const widthPercentage = isFront ? 0.85 : 0.95;
    const heightPercentage = isFront ? 1 : 0.975;

    const newWidth = Math.floor(pageBounds.width * widthPercentage);
    const newHeight = Math.floor(pageBounds.height * heightPercentage);

    const xOffset = Math.floor((pageBounds.width - newWidth) / 2);
    const yOffset = Math.floor((pageBounds.height - newHeight) / 2);

    return {
      x: pageBounds.x + xOffset,
      y: pageBounds.y + yOffset,
      width: newWidth,
      height: newHeight
    };
  }
}

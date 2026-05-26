import { Tab, tabService } from "@/services/tab-service";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { app } from "electron";

const HANDOFF_ACTIVITY_TYPE = "NSUserActivityTypeBrowsingWeb";

type HandoffStatus = "inactive" | "active" | "resigned";

class HandoffController {
  private status: HandoffStatus = "inactive";
  private activeWebpageURL: string | null = null;
  private observedTabIds: Set<number> = new Set();

  constructor() {
    this.initialize();
  }

  public get activityType(): string {
    return HANDOFF_ACTIVITY_TYPE;
  }

  public get currentStatus(): HandoffStatus {
    return this.status;
  }

  private initialize() {
    if (process.platform !== "darwin") {
      return;
    }

    this.observeExistingTabs();
    this.observeTabLifecycle();
    this.observeTabStateChanges();
    this.observeAppFocusState();
  }

  private observeExistingTabs() {
    for (const tab of tabService.tabs.values()) {
      this.observeTab(tab);
    }
  }

  private observeTabLifecycle() {
    tabService.on("tab-created", (tab) => {
      this.observeTab(tab);
    });
  }

  private observeTabStateChanges() {
    tabService.on("active-changed", (windowId, spaceId) => {
      this.syncFocusedWindowHandoffActivity(windowId, spaceId, "active-tab-changed");
    });

    tabService.on("focused-tab-changed", (windowId, spaceId) => {
      this.syncFocusedWindowHandoffActivity(windowId, spaceId, "active-tab-changed");
    });
  }

  private observeAppFocusState() {
    app.on("browser-window-focus", (_event, focusedWindow) => {
      const window = browserWindowsController.getWindowById(focusedWindow.id);
      if (!window) return;

      const spaceId = window.currentSpaceId;
      if (!spaceId) return;

      this.syncFocusedWindowHandoffActivity(window.id, spaceId, "window-focused");
    });

    app.on("browser-window-blur", () => {
      // Defer to allow same-app focus switches to settle.
      setTimeout(() => {
        this.resignCurrentHandoffActivityIfNoFocusedWindow();
      }, 0);
    });

    app.on("did-resign-active", () => {
      this.resignCurrentHandoffActivityIfNoFocusedWindow();
    });
  }

  private observeTab(tab: Tab) {
    if (this.observedTabIds.has(tab.id)) return;
    this.observedTabIds.add(tab.id);

    const disconnectUpdated = tab.connect("updated", (properties) => {
      if (!properties.includes("url")) return;
      this.syncFocusedWindowHandoffActivity(tab.getWindow().id, tab.spaceId, "url-changed", tab.id);
    });

    let disconnectDestroyed: (() => void) | null = null;
    disconnectDestroyed = tab.connect("destroyed", () => {
      disconnectUpdated();
      disconnectDestroyed?.();
      this.observedTabIds.delete(tab.id);
    });
  }

  private getDisplayedTab(windowId: number, spaceId: string): Tab | undefined {
    // In the new system, focused tab is the displayed tab
    return tabService.getFocusedTab(windowId, spaceId);
  }

  private syncFocusedWindowHandoffActivity(
    windowId: number,
    spaceId: string,
    reason: "active-tab-changed" | "current-space-changed" | "url-changed" | "window-focused",
    changedTabId?: number
  ) {
    if (!app.isReady()) {
      return;
    }

    const focusedWindow = browserWindowsController.getFocusedWindow();
    if (!focusedWindow || focusedWindow.id !== windowId) {
      return;
    }

    const currentSpaceId = browserWindowsController.getWindowById(windowId)?.currentSpaceId;
    if (currentSpaceId && currentSpaceId !== spaceId) {
      return;
    }

    const displayedTab = this.getDisplayedTab(windowId, spaceId);
    if (reason === "url-changed" && (!changedTabId || displayedTab?.id !== changedTabId)) {
      return;
    }

    const currentURL = displayedTab?.url;
    const parsedURL = currentURL ? URL.parse(currentURL) : null;
    const handoffWebpageURL =
      parsedURL && (parsedURL.protocol === "http:" || parsedURL.protocol === "https:") ? parsedURL.toString() : null;

    if (!displayedTab || !handoffWebpageURL) {
      this.invalidateCurrentHandoffActivity();
      return;
    }

    const userInfo = {
      tabId: displayedTab.id,
      windowId,
      spaceId,
      title: displayedTab.title,
      url: handoffWebpageURL
    };

    const shouldUpdate =
      reason !== "window-focused" &&
      this.status === "active" &&
      app.getCurrentActivityType() === HANDOFF_ACTIVITY_TYPE &&
      this.activeWebpageURL === handoffWebpageURL;

    if (shouldUpdate) {
      app.updateCurrentActivity(HANDOFF_ACTIVITY_TYPE, userInfo);
    } else {
      app.setUserActivity(HANDOFF_ACTIVITY_TYPE, userInfo, handoffWebpageURL);
    }

    this.status = "active";
    this.activeWebpageURL = handoffWebpageURL;
  }

  private invalidateCurrentHandoffActivity() {
    const hasCurrentActivity =
      this.activeWebpageURL !== null ||
      this.status === "resigned" ||
      app.getCurrentActivityType() === HANDOFF_ACTIVITY_TYPE;

    if (!hasCurrentActivity) {
      return;
    }

    app.invalidateCurrentActivity();
    this.activeWebpageURL = null;
    this.status = "inactive";
  }

  private resignCurrentHandoffActivityIfNoFocusedWindow() {
    if (!app.isReady()) {
      return;
    }

    const focusedWindow = browserWindowsController.getFocusedWindow();
    if (focusedWindow) {
      return;
    }

    if (app.getCurrentActivityType() !== HANDOFF_ACTIVITY_TYPE) {
      return;
    }

    app.resignCurrentActivity();
    this.status = "resigned";
  }
}

export const handoffController = new HandoffController();

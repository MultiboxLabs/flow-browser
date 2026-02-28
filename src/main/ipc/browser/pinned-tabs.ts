import { pinnedTabsController } from "@/controllers/pinned-tabs-controller";
import { tabsController } from "@/controllers/tabs-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { PinnedTabData } from "~/types/pinned-tabs";

// --- Change notification ---

const DEBOUNCE_MS = 80;
let changeTimeout: NodeJS.Timeout | null = null;
let pendingChange = false;

function schedulePinnedTabsChange() {
  pendingChange = true;
  if (changeTimeout) return;
  changeTimeout = setTimeout(() => {
    processPinnedTabsChange();
    changeTimeout = null;
  }, DEBOUNCE_MS);
}

function processPinnedTabsChange() {
  if (!pendingChange) return;
  pendingChange = false;

  const allByProfile = pinnedTabsController.getAllByProfile();
  for (const window of browserWindowsController.getWindows()) {
    window.sendMessageToCoreWebContents("pinned-tabs:on-changed", allByProfile);
  }
}

// Listen for changes from the controller
pinnedTabsController.onChanged(() => {
  schedulePinnedTabsChange();
});

// --- Wire tab destruction ---
// When a browser tab is destroyed, clear any pinned tab association pointing to it.
tabsController.on("tab-removed", (tab) => {
  pinnedTabsController.onBrowserTabDestroyed(tab.id);
});

// --- IPC Handlers ---

/**
 * Get all pinned tabs grouped by profile ID.
 */
ipcMain.handle("pinned-tabs:get-data", async () => {
  return pinnedTabsController.getAllByProfile();
});

/**
 * Create a pinned tab from an existing browser tab.
 * The tab's current URL becomes the pinned tab's defaultUrl.
 */
ipcMain.handle("pinned-tabs:create-from-tab", async (_event, tabId: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return null;

  const url = tab.url;
  if (!url) return null;

  const faviconUrl = tab.faviconURL ?? null;
  const pinnedTab = pinnedTabsController.create(tab.profileId, url, faviconUrl);

  // Associate the pinned tab with the browser tab
  pinnedTabsController.associateTab(pinnedTab.uniqueId, tab.id);

  return pinnedTab;
});

/**
 * Click handler: activate or create the associated browser tab.
 * If the pinned tab already has an associated live tab, switch to it.
 * Otherwise, create a new tab with the pinned tab's defaultUrl.
 */
ipcMain.handle("pinned-tabs:click", async (event, pinnedTabId: string) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return false;

  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId);

  if (associatedTabId !== null) {
    // Tab is already associated — switch to it
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && !tab.isDestroyed) {
      tabsController.setActiveTab(tab);
      return true;
    }
    // Tab was destroyed but association wasn't cleaned up — clear it
    pinnedTabsController.dissociateTab(pinnedTabId);
  }

  // No associated tab — create a new one
  const spaceId = await getSpaceForPinnedTab(pinnedTab, window);
  if (!spaceId) return false;

  const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
    url: pinnedTab.defaultUrl
  });

  pinnedTabsController.associateTab(pinnedTabId, newTab.id);
  tabsController.setActiveTab(newTab);

  return true;
});

/**
 * Double-click handler: navigate associated tab back to defaultUrl.
 * If the tab is on a different URL, navigates it back. If no associated tab, behaves like click.
 */
ipcMain.handle("pinned-tabs:double-click", async (event, pinnedTabId: string) => {
  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return false;

  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId);
  if (associatedTabId !== null) {
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && !tab.isDestroyed) {
      // Navigate back to defaultUrl
      tab.loadURL(pinnedTab.defaultUrl);
      tabsController.setActiveTab(tab);
      return true;
    }
  }

  // No valid associated tab — fall through to click behavior
  // (re-invoke the click handler logic)
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const spaceId = await getSpaceForPinnedTab(pinnedTab, window);
  if (!spaceId) return false;

  const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
    url: pinnedTab.defaultUrl
  });

  pinnedTabsController.associateTab(pinnedTabId, newTab.id);
  tabsController.setActiveTab(newTab);
  return true;
});

/**
 * Remove a pinned tab.
 */
ipcMain.handle("pinned-tabs:remove", async (_event, pinnedTabId: string) => {
  pinnedTabsController.remove(pinnedTabId);
  return true;
});

/**
 * Reorder a pinned tab to a new position.
 */
ipcMain.handle("pinned-tabs:reorder", async (_event, pinnedTabId: string, newPosition: number) => {
  pinnedTabsController.reorder(pinnedTabId, newPosition);
  return true;
});

/**
 * Show the context menu for a pinned tab.
 */
ipcMain.on("pinned-tabs:show-context-menu", (event, pinnedTabId: string) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return;

  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return;

  const contextMenu = new Menu();

  contextMenu.append(
    new MenuItem({
      label: "Unpin",
      click: () => {
        pinnedTabsController.remove(pinnedTabId);
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      type: "separator"
    })
  );

  // "Reset to Default" — navigate associated tab back to defaultUrl
  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId);
  const associatedTab = associatedTabId !== null ? tabsController.getTabById(associatedTabId) : undefined;
  const isOnDifferentUrl = associatedTab && associatedTab.url !== pinnedTab.defaultUrl;

  contextMenu.append(
    new MenuItem({
      label: "Reset to Default",
      enabled: !!isOnDifferentUrl,
      click: () => {
        if (associatedTab && !associatedTab.isDestroyed) {
          associatedTab.loadURL(pinnedTab.defaultUrl);
        }
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      label: "Copy URL",
      click: () => {
        clipboard.writeText(pinnedTab.defaultUrl);
      }
    })
  );

  contextMenu.popup({
    window: window.browserWindow
  });
});

// --- Helpers ---

/**
 * Find an appropriate space for a pinned tab within its profile.
 * Uses the current window's space if it matches the profile, otherwise falls back.
 */
async function getSpaceForPinnedTab(pinnedTab: PinnedTabData, window: BrowserWindow): Promise<string | null> {
  const currentSpaceId = window.currentSpaceId;
  if (currentSpaceId) {
    const space = await spacesController.get(currentSpaceId);
    if (space && space.profileId === pinnedTab.profileId) {
      return currentSpaceId;
    }
  }

  // Fall back to the last used space in the profile
  const lastUsedSpace = await spacesController.getLastUsedFromProfile(pinnedTab.profileId);
  return lastUsedSpace?.id ?? null;
}

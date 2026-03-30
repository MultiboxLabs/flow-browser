import { pinnedTabsController } from "@/controllers/pinned-tabs-controller";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { PinnedTabData } from "~/types/pinned-tabs";
import { moveTabOrGroupToWindow } from "@/controllers/tabs-controller/tab-sync";

// --- Change notification ---

let changeTimeout: NodeJS.Timeout | null = null;

function schedulePinnedTabsChange() {
  if (changeTimeout) clearTimeout(changeTimeout);
  changeTimeout = setTimeout(() => {
    changeTimeout = null;
    const allByProfile = pinnedTabsController.getAllByProfile();
    for (const window of browserWindowsController.getWindows()) {
      window.sendMessageToCoreWebContents("pinned-tabs:on-changed", allByProfile);
    }
  }, 80);
}

// Listen for changes from the controller
pinnedTabsController.on("changed", () => {
  schedulePinnedTabsChange();
});

// --- Wire tab destruction ---
// When a browser tab is destroyed, clear any pinned tab association pointing to it.
tabsController.on("tab-removed", (tab) => {
  pinnedTabsController.onBrowserTabDestroyed(tab.id);
});

// NOTE: Pinned tabs are per-profile, but their associated ephemeral tabs live
// in a specific space. We intentionally do NOT move them when switching spaces
// so that each space maintains its own independent active-tab state. The
// associated tab is moved to the current space only when the user explicitly
// clicks the pinned tab (see handlePinnedTabClick).

// --- Shared helpers ---

/**
 * Create a new ephemeral tab for a pinned tab in a specific space, associate it, and activate it.
 */
async function createAndAssociatePinnedTab(
  pinnedTabId: string,
  pinnedTab: PinnedTabData,
  window: BrowserWindow,
  spaceId: string,
  url?: string
) {
  const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
    url: url ?? pinnedTab.defaultUrl,
    ephemeral: true
  });

  pinnedTabsController.associateTab(pinnedTabId, spaceId, newTab.id);
  tabsController.activateTab(newTab);
  return newTab;
}

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
ipcMain.handle("pinned-tabs:create-from-tab", async (_event, tabId: number, position?: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab) return null;

  const url = tab.url;
  if (!url) return null;

  const faviconUrl = tab.faviconURL ?? null;
  const pinnedTab = pinnedTabsController.create(tab.profileId, url, faviconUrl, position);

  // Mark the tab as ephemeral so it won't be persisted across sessions
  tabsController.makeTabEphemeral(tab.id);

  // Associate the pinned tab with the browser tab in its current space
  pinnedTabsController.associateTab(pinnedTab.uniqueId, tab.spaceId, tab.id);

  return { ...pinnedTab, associatedTabIdsBySpace: { [tab.spaceId]: tab.id } };
});

/**
 * Click handler: activate or create the associated browser tab for the current space.
 * If the pinned tab already has an associated live tab in the current space, switch to it.
 * Otherwise, create a new tab with the pinned tab's defaultUrl in the current space.
 *
 * When navigateToDefault is true (double-click), also navigates the
 * associated tab back to the pinned tab's defaultUrl first.
 */
async function handlePinnedTabClick(
  window: BrowserWindow,
  pinnedTabId: string,
  navigateToDefault: boolean
): Promise<boolean> {
  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return false;

  // Get the current space ID
  const currentSpaceId = window.currentSpaceId;
  if (!currentSpaceId) return false;

  // Check if there's already an associated tab for this space
  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId, currentSpaceId);

  if (associatedTabId !== null) {
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && !tab.isDestroyed) {
      // Move to the requesting window if needed
      if (tab.getWindow().id !== window.id) {
        await moveTabOrGroupToWindow(tab, window);
      }

      if (navigateToDefault && tab.url !== pinnedTab.defaultUrl) {
        tab.loadURL(pinnedTab.defaultUrl);
      }
      tabsController.activateTab(tab);
      return true;
    }
    // Tab was destroyed but association wasn't cleaned up — clear it
    pinnedTabsController.dissociateTab(pinnedTabId, currentSpaceId);
  }

  // No associated tab for this space — create a new one
  const newTab = await createAndAssociatePinnedTab(pinnedTabId, pinnedTab, window, currentSpaceId);
  return newTab !== null;
}

ipcMain.handle("pinned-tabs:click", async (event, pinnedTabId: string) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!window) return false;
  return handlePinnedTabClick(window, pinnedTabId, false);
});

ipcMain.handle("pinned-tabs:double-click", async (event, pinnedTabId: string) => {
  const window = browserWindowsController.getWindowFromWebContents(event.sender);
  if (!window) return false;
  return handlePinnedTabClick(window, pinnedTabId, true);
});

/**
 * Remove a pinned tab.
 * Also destroys all associated ephemeral tabs (if any) so they don't leak.
 */
ipcMain.handle("pinned-tabs:remove", async (_event, pinnedTabId: string) => {
  const removedTabIds = pinnedTabsController.remove(pinnedTabId);
  for (const tabId of removedTabIds) {
    const tab = tabsController.getTabById(tabId);
    if (tab && !tab.isDestroyed) {
      tab.destroy();
    }
  }
  return true;
});

/**
 * Unpin a tab back to the tab list in the current space.
 * Removes the association for the current space and makes that tab persistent
 * so it reappears in the sidebar at the given position.
 * If there is no associated tab in the current space, creates a new persistent tab.
 */
ipcMain.handle("pinned-tabs:unpin-to-tab-list", async (event, pinnedTabId: string, position?: number) => {
  const webContents = event.sender;
  const window = browserWindowsController.getWindowFromWebContents(webContents);
  if (!window) return false;

  const currentSpaceId = window.currentSpaceId;
  if (!currentSpaceId) return false;

  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return false;

  // Get the associated tab for the current space
  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId, currentSpaceId);

  let preservedTabId: number | null = null;

  // Make the associated tab persistent so it reappears in the sidebar
  if (associatedTabId !== null) {
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && position !== undefined) {
      tab.updateStateProperty("position", position);
    }
    tabsController.makeTabPersistent(associatedTabId);
    if (tab) {
      preservedTabId = tab.id;
      tabsController.normalizePositions(tab.getWindow().id, tab.spaceId);
    }
  } else {
    // No associated tab in this space — create a new persistent tab with the defaultUrl
    const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, currentSpaceId, undefined, {
      url: pinnedTab.defaultUrl,
      position
    });

    tabsController.activateTab(newTab);
    tabsController.normalizePositions(window.id, currentSpaceId);
  }

  // Remove the pinned-tab record after the live tab has been restored to the
  // regular tab list. This keeps unpinning aligned with the remove/unpin
  // behavior used elsewhere in the feature.
  const removedTabIds = pinnedTabsController.remove(pinnedTabId);
  for (const tabId of removedTabIds) {
    if (tabId === preservedTabId) continue;
    const tab = tabsController.getTabById(tabId);
    if (tab && !tab.isDestroyed) {
      tab.destroy();
    }
  }

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
        const removedTabIds = pinnedTabsController.remove(pinnedTabId);
        for (const tabId of removedTabIds) {
          const tab = tabsController.getTabById(tabId);
          if (tab && !tab.isDestroyed) {
            tab.destroy();
          }
        }
      }
    })
  );

  contextMenu.append(
    new MenuItem({
      type: "separator"
    })
  );

  // "Reset to Default" — navigate associated tab in current space back to defaultUrl
  const currentSpaceId = window.currentSpaceId;
  const associatedTabId = currentSpaceId ? pinnedTabsController.getAssociatedTabId(pinnedTabId, currentSpaceId) : null;
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

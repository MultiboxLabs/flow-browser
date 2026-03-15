import { pinnedTabsController } from "@/controllers/pinned-tabs-controller";
import { tabsController } from "@/controllers/tabs-controller";
import { spacesController } from "@/controllers/spaces-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import { clipboard, ipcMain, Menu, MenuItem } from "electron";
import { PinnedTabData } from "~/types/pinned-tabs";

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

// --- Wire space changes ---
// When the user switches spaces, move all ephemeral pinned-tab-associated tabs
// from the same profile into the new space so they remain visible.
// Pinned tabs are per-profile, not per-space, so their associated tabs should
// follow the user across spaces within the same profile.
tabsController.on("current-space-changed", (windowId, newSpaceId) => {
  // Resolve the profile for the new space (synchronous cache lookup)
  const space = spacesController.getFromCache(newSpaceId);
  if (space) {
    movePinnedAssociatedTabs(windowId, newSpaceId, space.profileId);
    return;
  }

  // Cache miss — fetch asynchronously and then move tabs.
  // Guard against stale closure: by the time the async lookup resolves
  // the user may have switched spaces again, so verify newSpaceId is
  // still the active space for this window before proceeding.
  spacesController.get(newSpaceId).then((fetched) => {
    if (!fetched) return;
    const currentSpaceNow = tabsController.windowActiveSpaceMap.get(windowId);
    if (currentSpaceNow !== newSpaceId) return;
    movePinnedAssociatedTabs(windowId, newSpaceId, fetched.profileId);
  });
});

function movePinnedAssociatedTabs(windowId: number, newSpaceId: string, profileId: string) {
  const associatedTabIds = pinnedTabsController.getAssociatedTabIdsForProfile(profileId);
  for (const tabId of associatedTabIds) {
    const tab = tabsController.getTabById(tabId);
    if (tab && tab.ephemeral && tab.getWindow().id === windowId && tab.spaceId !== newSpaceId) {
      tab.setSpace(newSpaceId);
    }
  }
}

// --- Shared helpers ---

/**
 * Move an ephemeral associated tab to the current space if it's in a different one.
 * Pinned tabs are per-profile, so the associated tab should follow the user across spaces.
 */
function moveEphemeralTabToCurrentSpace(
  tab: ReturnType<typeof tabsController.getTabById>,
  currentSpaceId: string | null
) {
  if (tab && currentSpaceId && tab.ephemeral && tab.spaceId !== currentSpaceId) {
    tab.setSpace(currentSpaceId);
  }
}

/**
 * Create a new ephemeral tab for a pinned tab, associate it, and activate it.
 */
async function createAndAssociatePinnedTab(
  pinnedTabId: string,
  pinnedTab: PinnedTabData,
  window: BrowserWindow,
  url?: string
) {
  const spaceId = await getSpaceForPinnedTab(pinnedTab, window);
  if (!spaceId) return null;

  const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
    url: url ?? pinnedTab.defaultUrl,
    ephemeral: true
  });

  pinnedTabsController.associateTab(pinnedTabId, newTab.id);
  tabsController.setActiveTab(newTab);
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

  // Associate the pinned tab with the browser tab
  pinnedTabsController.associateTab(pinnedTab.uniqueId, tab.id);

  return { ...pinnedTab, associatedTabId: tab.id };
});

/**
 * Click handler: activate or create the associated browser tab.
 * If the pinned tab already has an associated live tab, switch to it.
 * Otherwise, create a new tab with the pinned tab's defaultUrl.
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

  const associatedTabId = pinnedTabsController.getAssociatedTabId(pinnedTabId);

  if (associatedTabId !== null) {
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && !tab.isDestroyed) {
      if (tab.getWindow().id !== window.id) {
        // Associations are single-tab, so reuse the live tab by moving it into
        // the requesting window before activating it there.
        tabsController.moveTabToWindow(tab, window);
      }
      if (navigateToDefault) {
        tab.loadURL(pinnedTab.defaultUrl);
      }
      moveEphemeralTabToCurrentSpace(tab, window.currentSpaceId);
      tabsController.setActiveTab(tab);
      return true;
    }
    // Tab was destroyed but association wasn't cleaned up — clear it
    pinnedTabsController.dissociateTab(pinnedTabId);
  }

  // No associated tab — create a new one
  const newTab = await createAndAssociatePinnedTab(pinnedTabId, pinnedTab, window);
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
 * Also destroys the associated ephemeral tab (if any) so it doesn't leak.
 */
ipcMain.handle("pinned-tabs:remove", async (_event, pinnedTabId: string) => {
  const removedTabId = pinnedTabsController.remove(pinnedTabId);
  if (removedTabId !== null) {
    const tab = tabsController.getTabById(removedTabId);
    if (tab && !tab.isDestroyed) {
      tab.destroy();
    }
  }
  return true;
});

/**
 * Unpin a tab back to the tab list.
 * Removes the pinned tab and, if there is an associated browser tab,
 * makes it persistent again so it reappears in the sidebar at the given position.
 * If there is no associated tab, creates a new persistent tab with the
 * pinned tab's defaultUrl at the requested position.
 */
ipcMain.handle("pinned-tabs:unpin-to-tab-list", async (event, pinnedTabId: string, position?: number) => {
  const pinnedTab = pinnedTabsController.getById(pinnedTabId);
  if (!pinnedTab) return false;

  // Remove the pinned tab. `remove()` returns the associated browser tab ID
  // (if any) and clears the association atomically, so we don't need a
  // separate lookup beforehand.
  const associatedTabId = pinnedTabsController.remove(pinnedTabId);

  // Make the associated tab persistent so it reappears in the sidebar
  if (associatedTabId !== null) {
    const tab = tabsController.getTabById(associatedTabId);
    if (tab && position !== undefined) {
      tab.updateStateProperty("position", position);
    }
    tabsController.makeTabPersistent(associatedTabId);
    if (tab) {
      tabsController.normalizePositions(tab.getWindow().id, tab.spaceId);
    }
  } else {
    // No associated tab — create a new persistent tab with the defaultUrl
    const webContents = event.sender;
    const window = browserWindowsController.getWindowFromWebContents(webContents);
    if (!window) return true;

    const spaceId = await getSpaceForPinnedTab(pinnedTab, window);
    if (!spaceId) return true;

    const newTab = await tabsController.createTab(window.id, pinnedTab.profileId, spaceId, undefined, {
      url: pinnedTab.defaultUrl,
      position
    });

    tabsController.setActiveTab(newTab);
    tabsController.normalizePositions(window.id, spaceId);
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
        const removedTabId = pinnedTabsController.remove(pinnedTabId);
        if (removedTabId !== null) {
          const tab = tabsController.getTabById(removedTabId);
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

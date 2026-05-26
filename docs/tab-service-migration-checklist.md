# Tab Service v2 Migration Checklist

## Overview

This document compares all functionality in the **old Tab Manager** (`controllers/tabs-controller` + `controllers/pinned-tabs-controller`, ~1850 lines combined) with the **new Tab Service** (`services/tab-service/`, ~1800 lines in `tab-service.ts` + supporting files).

---

## ✅ Successfully Migrated

### Tab CRUD & Lifecycle

| Feature                      | Old Location                            | New Location                                        | Notes                                  |
| ---------------------------- | --------------------------------------- | --------------------------------------------------- | -------------------------------------- |
| Tab creation (internal)      | `internalCreateTab`                     | `createTabInternal`                                 | Same logic, cleaner separation         |
| Tab creation (public/async)  | `createTab`                             | `createTab`                                         | Profile/space resolution unchanged     |
| Tab destruction              | `removeTab` + `tab.destroy()`           | `destroyTab` + `"destroyed"` handler                | Handled via event in wireTabEvents     |
| Tab sleep/wake               | `TabLifecycleManager.putToSleep/wakeUp` | `Tab.putToSleep/wakeUp`                             | Moved into Tab class                   |
| Periodic auto-sleep/archive  | `setInterval` in constructor            | `tab-lifecycle-timer.ts`                            | Dedicated module, same 10s interval    |
| Tab persistence (save)       | `persistTab` → `tabPersistenceManager`  | `TabPersistenceService`                             | New dedicated service                  |
| Tab serialization            | `serializeTab` utility                  | `Tab.serialize()` + cache                           | Per-tab cache for performance          |
| Recently closed              | `recentlyClosedManager` singleton       | `RecentlyClosedManager` class on TabService         | Inline class                           |
| Ephemeral tabs               | `makeTabEphemeral/makeTabPersistent`    | `tab.owner.kind` property                           | Typed ownership model replaces boolean |
| Tab `updateTabState` polling | webContents event listeners             | Same event listeners in `Tab.wireWebContentsEvents` | Identical approach                     |

### Active Tab Management

| Feature                       | Old Location                      | New Location                            | Notes                                       |
| ----------------------------- | --------------------------------- | --------------------------------------- | ------------------------------------------- |
| Activate tab                  | `activateTab` → `setActiveTab`    | `activateTab`                           | Direct activation, no separate setActiveTab |
| Focused tab management        | `setFocusedTab/removeFocusedTab`  | `layout.setFocusedTab/removeFocusedTab` | Moved to per-layout                         |
| Activation history (MRU)      | `spaceActivationHistory` map      | `TabLayout._activationHistory`          | Per-layout now                              |
| Remove active + select next   | `removeActiveTab`                 | `layout.removeActiveAndSelectNext`      | Same history-first, then position fallback  |
| Activate next/previous tab    | `activateNextTabInSpace/Previous` | `activateNextTab/activatePreviousTab`   | Same wrap-around logic                      |
| `isTabActive` check           | `spaceActiveTabMap` lookup        | Checks all layouts in window            | Handles multi-layout membership             |
| `isTabVisibleInAnotherWindow` | Checks other windows' active tabs | Same check + uses `layout.visible`      | Simplified for multi-layout                 |

### Window/Space Management

| Feature                     | Old Location                           | New Location                | Notes                                 |
| --------------------------- | -------------------------------------- | --------------------------- | ------------------------------------- |
| Set current window space    | `setCurrentWindowSpace`                | `setCurrentWindowSpace`     | Same logic + layout visibility toggle |
| Process active tab change   | `processActiveTabChange`               | `updateTabVisibility`       | Visibility + bounds delegation        |
| Space deletion cleanup      | `spacesController.on("space-deleted")` | Same event handler          | Destroys orphaned tabs                |
| Window entries cleanup      | `cleanupWindowEntries`                 | `removeAllLayoutsForWindow` | Called on window close                |
| Popup window reconciliation | `reconcilePopupWindow`                 | `reconcilePopupWindow`      | Same auto-close + best-target logic   |
| Page bounds changed         | `handlePageBoundsChanged`              | `handlePageBoundsChanged`   | Delegates to layout.applyBounds       |

### Tab Groups (now TabLayoutNode)

| Feature                     | Old Location                         | New Location                     | Notes                        |
| --------------------------- | ------------------------------------ | -------------------------------- | ---------------------------- |
| Create group (glance/split) | `createTabGroup`                     | `createLayoutNode`               | Same concept, different name |
| Destroy group               | `destroyTabGroup`                    | `destroyLayoutNode`              | Layout handles cleanup       |
| Group events (changed)      | `tabGroup.on("changed")`             | Layout structural changes        | Folded into layout emission  |
| Group persistence           | `tabPersistenceManager.saveTabGroup` | `TabPersistenceService`          | Saves node mode & tab IDs    |
| Glance front tab            | `GlanceTabGroup.setFrontTab`         | `TabLayoutNode.setFrontTab`      | Same concept                 |
| Split bounds                | `SplitTabGroup` bounds logic         | `TabLayoutNode.computeTabBounds` | Inline in node               |

### Tab Properties & Events

| Feature                    | Old Location                       | New Location                     | Notes                            |
| -------------------------- | ---------------------------------- | -------------------------------- | -------------------------------- |
| Tab position normalization | `normalizePositions`               | `positioner.normalizePositions`  | Dedicated TabPositioner class    |
| Tab move (reorder)         | `updateStateProperty("position")`  | `moveTab` + normalize            | Explicit API                     |
| Tab move to space          | Manual space change                | `moveTabToSpace`                 | Full layout migration            |
| Batch move tabs            | N/A (done tab-by-tab)              | `batchMoveTabs`                  | New optimization                 |
| Tab content changes        | `windowTabContentChanged`          | `emitContentChange`              | Debounced + cached               |
| Tab structural changes     | `windowTabsChanged`                | `emitStructuralChange`           | Debounced with batch suppression |
| Picture-in-Picture         | `disablePictureInPicture`          | `disablePictureInPicture`        | Same logic                       |
| Set muted                  | Direct `webContents.setAudioMuted` | `setTabMuted` → `updateTabState` | Now emits content change         |

### Pinned Tabs

| Feature                   | Old Location                         | New Location                                      | Notes                           |
| ------------------------- | ------------------------------------ | ------------------------------------------------- | ------------------------------- |
| Create pinned tab         | `pinnedTabsController.create`        | `tabService.createPinnedTab`                      | Same DB write + normalize       |
| Remove pinned tab         | `pinnedTabsController.remove`        | `tabService.removePinnedTab`                      | Destroys associated tabs        |
| Reorder pinned tab        | `pinnedTabsController.reorder`       | `tabService.reorderPinnedTab`                     | Same normalize logic            |
| Update favicon            | `pinnedTabsController.updateFavicon` | `PinnedTab.updateFavicon`                         | On the OOP object now           |
| Associate/dissociate tabs | `associateTab/dissociateTab` maps    | `PinnedTab.associate/dissociate`                  | Encapsulated in PinnedTab class |
| Per-space associations    | `Map<pinnedId, Map<spaceId, tabId>>` | `PinnedTab._associatedTabs`                       | Same per-space model            |
| Reverse lookup by tab ID  | `reverseAssociations` map            | `tabService.getPinnedTabByAssociatedTabId`        | Iterates pinned tabs            |
| Click pinned tab          | External IPC handler                 | `tabService.clickPinnedTab`                       | Full lifecycle + placeholder    |
| Pinned node propagation   | N/A (old had per-space instances)    | `propagatePinnedTabNode` + `PinnedTab.layoutNode` | Multi-layout membership         |

### IPC & Renderer Communication

| Feature                 | Old Location              | New Location                         | Notes                           |
| ----------------------- | ------------------------- | ------------------------------------ | ------------------------------- |
| Window tab data payload | `windowTabsChanged`       | `getWindowTabsPayload` + debounce    | Serialization cache             |
| Content-only updates    | `windowTabContentChanged` | `emitContentChange` + dirty tracking | Only re-serializes changed tabs |
| Pinned tab data         | Separate IPC endpoint     | Included in `getWindowTabsPayload`   | Unified payload                 |

### Extension Integration

| Feature                    | Old Location                                       | New Location                                             | Notes                                               |
| -------------------------- | -------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| `extensions.addTab`        | In old Tab constructor                             | `Tab.createView` / `Tab.wakeUp`                          | Called when webContents exists                      |
| `extensions.removeTab`     | On tab destroy                                     | `Tab.teardownView`                                       | Before view disposal                                |
| `extensions.selectTab`     | On activate                                        | `activateTab` → `tab.loadedProfile.extensions.selectTab` | Same trigger                                        |
| `tab-updated` emission     | `setupTabLevelListeners` → `on("updated")` handler | `wireTabEvents` → `on("updated")` handler                | Was lost in migration, now restored                 |
| `assignTabDetails` (index) | N/A (was always -1)                                | `tabService.getTabIndexInWindowProfile(tab)`             | **NEW** - proper index via `getTabsInWindowProfile` |
| Index change notification  | Never existed                                      | `notifyIndexChanges` on create/destroy/move              | **NEW** - all tabs in profile get notified          |

---

## 🔧 Fixed In This Commit (Previously Missing)

| Feature                                        | Issue                                                                     | Fix                                                                        |
| ---------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Extension state update on tab property changes | Old `setupTabLevelListeners` emitted `tab-updated`; lost during migration | Added `notifyExtensionsOfChanges()` in `wireTabEvents` `"updated"` handler |
| Extension index update on tab creation         | New tab shifts indices of existing tabs                                   | Added `notifyIndexChanges` after `createTabInternal`                       |
| Extension index update on tab destruction      | Remaining tabs shift indices                                              | Added `notifyIndexChanges` in `"destroyed"` handler                        |
| Extension index update on cross-window move    | Tab moves between windows shifts indices in both                          | Added `notifyIndexChanges` for both old and new window                     |
| Extension index update on space move           | `moveTabToSpace` shifts indices                                           | Added `notifyIndexChanges` after normalize                                 |
| Extension index update on batch move           | `batchMoveTabs` shifts indices                                            | Added `notifyIndexChanges` for affected profiles                           |

---

## ⏭️ Intentionally Not Migrated

| Feature                                                              | Reason                                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `TabLayoutManager` (per-tab layout helper)                           | Replaced by centralized `TabLayout.applyBounds` + `TabLayoutNode.computeTabBounds` |
| `TabBoundsController` (per-tab bounds)                               | Same — bounds calculation is now layout-level with per-node secondary calculation  |
| `TabLifecycleManager.setupFullScreenListeners`                       | Moved to `Tab.setupWindowFullScreenListener` (self-contained)                      |
| Separate `windowTabsChanged`/`windowTabContentChanged` IPC functions | Replaced by internal event system → debounced IPC emission via `processQueues`     |
| `tabPersistenceManager` singleton                                    | Replaced by `TabPersistenceService` class instantiated by TabService               |
| `shouldPersistTab` as standalone function                            | Now: `tab.owner.kind === "normal"` + tab/window type checks inline                 |
| `registerTabsController` for tab-sync                                | Tab sync is now integrated via hooks directly in TabService                        |
| `getTabGroupByTabId` / `getTabGroupById` (string IDs)                | Groups are now `TabLayoutNode`s accessed via layout; no separate registry          |
| `tabGroupCounter` (string ID generation)                             | Nodes use integer IDs generated by TabLayout                                       |
| `removeFromActivationHistory` (by string group ID)                   | Activation history is per-layout; node destruction auto-cleans                     |

---

## Notes

- The old `Tab` class lived in `controllers/tabs-controller/tab.ts`; the new one is at `services/tab-service/core/tab.ts` and is significantly more self-contained (owns its own webContents lifecycle, view creation/teardown, fullscreen, PiP).
- The old context menu was a separate file (`context-menu.ts`); the new one is split into `web-context-menu.ts` (page right-click) and `tab-context-menus.ts` (sidebar tab item right-click).
- The old `Tab` class emitted `"tab-updated"` on webContents inside `setupTabLevelListeners()` whenever the `"updated"` event fired. This was lost during the Tab Service v2 migration. The new `Tab.notifyExtensionsOfChanges()` method restores this behavior and is called from `wireTabEvents`.
- The `electron-chrome-extensions` library automatically handles `did-start-navigation`, `did-redirect-navigation`, `did-navigate-in-page`, `page-favicon-updated`, and `page-title-updated` events. The custom `"tab-updated"` event (via `notifyExtensionsOfChanges`) is for everything else — muted state, discarded state, index changes, and any property not covered by built-in Electron events.

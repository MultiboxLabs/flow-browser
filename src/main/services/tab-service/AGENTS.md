# Tab Service — Agent Guide

> **Maintenance rule:** When you modify any code in this directory, update this file to reflect
> the change (new classes, renamed methods, changed invariants, new patterns, etc.). Keep this
> document accurate and current — future agents rely on it.

## Architecture Overview

Tab Service v2 is the central system for managing tabs, pinned tabs, layouts, and tab-related IPC in Flow Browser. It replaced the old `tabs-controller` with an OOP, event-driven design.

### Singleton Initialization

```
tabService        → TabService instance (central orchestrator)
tabPersistenceService → TabPersistenceService (save/restore to SQLite)
tabIPC            → TabIPC (renderer communication)
initializeTabService() → called at app startup after DB is ready
```

All singletons are created in `index.ts`.

### Core Classes

| Class                   | File                                     | Purpose                                                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TabService`            | `tab-service.ts`                         | Central orchestrator. Manages all tabs, pinned tabs, layouts. Emits events for IPC, persistence, and sync.                                                                                                                            |
| `Tab`                   | `core/tab.ts`                            | Represents a single browser tab. Owns its WebContentsView, layer, lifecycle (sleep/wake), favicon, navigation history, and fullscreen state. Emits `"updated"` on property changes.                                                   |
| `TabLayoutNode`         | `core/tab-layout-node.ts`                | Display grouping of 1+ tabs. Modes: `"single"`, `"glance"` (stacked preview), `"split"` (side-by-side). Can exist in multiple layouts (STAW / pinned tabs). Has an `activeLayout` — real content shows there, placeholders elsewhere. |
| `TabLayout`             | `layout/tab-layout.ts`                   | Per window-space. Tracks active node, focused tab, activation history. Controls visibility of its nodes.                                                                                                                              |
| `TabPositioner`         | `layout/tab-positioner.ts`               | Manages tab ordering via floating-point positions. Supports insert-top, insert-bottom, insert-after, and normalization.                                                                                                               |
| `PinnedTab`             | `core/pinned-tab.ts`                     | Persistent URL shortcut tied to a profile. Has per-space associations (spaceId → tabId). Stores a direct reference to its shared `layoutNode`.                                                                                        |
| `TabIPC`                | `ipc/tab-ipc.ts`                         | Handles all IPC with renderer. Debounced (32ms) structural and content change notifications. Per-tab serialization cache with dirty tracking. Batch suppression for session restore.                                                  |
| `TabPersistenceService` | `persistence/tab-persistence-service.ts` | Autosaves tab state to SQLite on a timer. Restores tabs on startup.                                                                                                                                                                   |
| `PinnedTabPersistence`  | `persistence/pinned-tab-persistence.ts`  | Save/load pinned tabs to/from DB.                                                                                                                                                                                                     |
| `RecentlyClosedManager` | `core/recently-closed-manager.ts`        | Tracks recently closed tabs for "Reopen Closed Tab" functionality.                                                                                                                                                                    |

### Supporting Modules

| Module                   | File                                                                                                                                                               | Purpose |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------- |
| `tab-sync.ts`            | Tab sync across windows. Screenshot placeholders, `moveTabToWindowIfNeeded`, `ensureNodeInLayout`. Pinned tabs always sync; normal tabs sync when setting enabled. |
| `tab-lifecycle-timer.ts` | 10s interval that auto-sleeps/archives inactive tabs.                                                                                                              |
| `tab-context-menus.ts`   | Sidebar tab right-click menu (Copy URL, Mute, Duplicate, Move To, Close, Pin/Unpin, Reopen).                                                                       |
| `web-context-menu.ts`    | Web page right-click context menu.                                                                                                                                 |
| `save-image-as.ts`       | "Save Image As" dialog helper.                                                                                                                                     |

## Key Patterns & Invariants

### Event Flow

```
Tab property changes → Tab emits "updated" → wireTabEvents handler →
  1. tab.notifyExtensionsOfChanges()  (emits "tab-updated" on webContents → extensions library)
  2. tabService.emitContentChange()   (→ TabIPC debounced → renderer)
```

### Extension Notifications

- `Tab.notifyExtensionsOfChanges()` emits `"tab-updated"` on `webContents`. This triggers `electron-chrome-extensions` to re-read `assignTabDetails` (title, url, favicon, discarded, index).
- `TabService.notifyIndexChanges(windowId, profileId)` calls `notifyExtensionsOfChanges()` on ALL tabs in the window+profile. Called after any structural change that shifts indices (create, destroy, move, reorder).
- `getTabsInWindowProfile(windowId, profileId)` returns tabs sorted by space order then `tab.position`. Used by `getTabIndexInWindowProfile(tab)` for the extension `tabDetails.index`.

### Layout & Multi-Layout Membership

- A `TabLayoutNode` can belong to multiple `TabLayout`s (via `_memberLayouts`).
- `activeLayout` determines where real content shows; other layouts show placeholders.
- Pinned tab nodes are propagated to ALL layouts of the same profile via `propagatePinnedTabNode`.
- Cross-window moves use `ensureNodeInLayout` (registers in target layout, sets activeLayout) — NOT destruction+recreation.

### Tab Positioning

- `tab.position` is a floating-point value. Lower = higher in sidebar.
- New tabs get `smallestPosition - 1` (insert at top) by default.
- `normalizePositions(windowId, spaceId)` rewrites positions to 0, 1, 2, ... after structural changes.
- Duplicate tabs use `sourceTab.position + 0.5` then `normalizePositions`.

### IPC & Serialization Cache

- `TabIPC` debounces at 32ms. Two queues: structural (full payload) and content (tab-specific dirty fields).
- Per-tab serialization cache (`tabCache`): only re-serializes dirty tabs.
- `beginBatch()` / `endBatch()` suppresses emissions during session restore.
- On structural changes, ALL tabs in affected windows have their cache evicted to guarantee fresh index/position data.

### Tab Sync (STAW)

- When enabled, all windows share the same tab set. Focusing a window moves the active tab's view there via `moveTabToWindowIfNeeded`.
- `sendPlaceholderForTab` captures a screenshot and sends it to the old window.
- Pinned tabs ALWAYS sync (regardless of the sync setting).
- Cross-window moves for pinned tabs just call `setWindow()` — no layout migration needed (node already propagated).

### PinnedTab Lifecycle

1. Created via `tabService.createPinnedTab(profileId, url, favicon)`.
2. First click in a space: `clickPinnedTab` → `createTab` with `owner: { kind: "pinned-tab" }` → associates tab with space.
3. Subsequent clicks: activates existing associated tab.
4. Cross-window click: captures placeholder in old window, calls `tab.setWindow()` (no layout migration).
5. `pinnedTab.layoutNode` stores direct reference to the shared node.
6. Pinning an existing live tab must immediately set `pinnedTab.layoutNode` and propagate that node to all same-profile layouts.

## Common Pitfalls

1. **`tab.spaceId` vs `window.currentSpaceId`** — For pinned tabs, `tab.spaceId` is the _creation_ space, not necessarily the space the tab is active in. Always use `window.currentSpaceId` when looking up the current layout for pinned tab operations.

2. **Serialization cache staleness** — If you add a new tab property that appears in the IPC payload, make sure it emits `content-change` when it changes (not just `structural-change`). The cache is only evicted for structural changes at payload build time.

3. **`normalizePositions` after reorders** — Any operation that creates fractional positions (duplicate, insert-after) MUST call `normalizePositions` afterward. Otherwise `getTabsInWindowProfile` may produce unstable ordering.

4. **Post-await guards** — Any method that `await`s (e.g., `sendPlaceholderForTab`) must check `tab.isDestroyed` / `window.destroyed` after the await before proceeding.

5. **Extension index correctness** — `getTabsInWindowProfile` must produce deterministic results. Sort by `tab.position` within each space (not by node.position, which can collide across spaces).

6. **Node destruction cascades** — Destroying a `TabLayoutNode` removes it from ALL member layouts. For pinned tabs, never destroy the shared node on cross-window moves — just change `activeLayout`.

7. **Lifecycle setting values** — `tab-lifecycle-timer.ts` must use `ArchiveTabValueMap` / `SleepTabValueMap` from `basic-settings`, not parse setting IDs as durations. Those maps are the canonical behavior contract for archive/sleep thresholds.

8. **Hidden layout visibility** — `updateTabVisibility` must not reveal tabs for hidden layouts. Hidden layouts may still update active/focused metadata, but visible layers are only changed after their space becomes current.

9. **Renderer-initiated new tabs** — For `window.open()` and web context-menu actions, derive the target space from the tab's current window at action time. Pinned/STAW tabs may be rendered in a different window/space than `tab.spaceId`.

## File Overview

```
tab-service/
  index.ts                    Entry point, singleton creation, exports
  tab-service.ts              TabService class (~1800 lines)
  tab-sync.ts                 Cross-window sync, placeholders
  tab-lifecycle-timer.ts      Auto-sleep/archive timer
  core/
    tab.ts                    Tab class (~850 lines)
    tab-layout-node.ts        TabLayoutNode class (~320 lines)
    pinned-tab.ts             PinnedTab class (~140 lines)
    recently-closed-manager.ts Recently closed tab tracking
    tab-context-menus.ts      Sidebar context menu
    web-context-menu.ts       Page context menu
    save-image-as.ts          Save image dialog
  layout/
    tab-layout.ts             TabLayout class (~380 lines)
    tab-positioner.ts         Position math (~70 lines)
  ipc/
    tab-ipc.ts                IPC handlers + debounced emission (~570 lines)
    preload-api.ts            Preload bridge API types
  persistence/
    tab-persistence-service.ts Autosave/restore tabs
    pinned-tab-persistence.ts  Pinned tab DB operations
```

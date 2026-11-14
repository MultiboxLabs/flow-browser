# Tab Service v2 — Architecture Document

## Overview

The Tab Service is the central tab management system for Flow Browser. It replaces the legacy `tabs-controller` and `pinned-tabs-controller` with a modular OOP architecture designed for extensibility.

**Total size:** ~5,400 lines across 17 files (vs. ~6,800 lines in the old system across 18 files).

---

## Module Structure

```
src/main/services/tab-service/
├── index.ts                          (57 lines)  — Entry point, singleton exports, initialization
├── tab-service.ts                   (1461 lines) — Central orchestrator
├── tab-sync.ts                       (495 lines) — Cross-window tab syncing (STAW)
├── tab-lifecycle-timer.ts             (65 lines) — Auto-sleep/archive background task
├── core/
│   ├── tab.ts                        (805 lines) — Tab entity (view, state, lifecycle)
│   ├── tab-layout-node.ts            (201 lines) — Display grouping (single/glance/split)
│   ├── pinned-tab.ts                 (135 lines) — Pinned tab entity
│   ├── recently-closed-manager.ts     (51 lines) — Undo-close ring buffer
│   ├── tab-context-menus.ts          (149 lines) — Right-click menus
│   ├── web-context-menu.ts           (358 lines) — Page content context menu
│   └── save-image-as.ts             (134 lines) — Image download logic
├── layout/
│   ├── tab-layout.ts                 (307 lines) — Per-window layout state
│   └── tab-positioner.ts             (70 lines)  — Tab ordering within spaces
├── persistence/
│   ├── tab-persistence-service.ts    (329 lines) — Dirty-tracked DB persistence
│   └── pinned-tab-persistence.ts      (49 lines) — Pinned tab DB operations
└── ipc/
    ├── tab-ipc.ts                    (513 lines) — IPC handlers + debounced renderer updates
    └── preload-api.ts                (109 lines) — Renderer-exposed API surface
```

---

## Core Entities

### Tab (`core/tab.ts`)

The fundamental unit. Owns:

- **Identity:** `id` (counter-based), `uniqueId` (UUID for persistence), `profileId`, `spaceId`
- **Ownership:** `owner: TabOwnerRef` — `{ kind: "normal" }`, `{ kind: "pinned", pinnedTabId }`, or `{ kind: "bookmark", bookmarkId }` (future)
- **View:** Nullable `WebContentsView`, `WebContents`, and `Layer` (null when asleep)
- **State:** `visible`, `fullScreen`, `isPictureInPicture`, `asleep`, `lastActiveAt`, `position`
- **Content:** `title`, `url`, `isLoading`, `audible`, `muted`, `navHistory`, `navHistoryIndex`

Key lifecycle:

```
create → [asleep] → wakeUp → active/inactive → putToSleep → [asleep] → wakeUp → ... → destroy
```

Sleep mode destroys the `WebContentsView` entirely, saving ~20-50MB RAM per tab. Navigation history is captured before sleep and restored on wake.

### TabLayoutNode (`core/tab-layout-node.ts`)

Represents one or more tabs displayed together in a window:

- **`single`** — One tab (default)
- **`glance`** — Two-tab stack: front (85% centered, z10) and back (95% centered, z9)
- **`split`** — Side-by-side (future, structure ready)

Auto-destroys when empty. Syncs all contained tabs to the same space/window.

### PinnedTab (`core/pinned-tab.ts`)

Persistent URL shortcuts, per-profile. Maintains a map of `spaceId → tabId` associations — one live `Tab` instance that "follows" the user across spaces. Pinned tabs always sync across windows regardless of the sync setting.

### TabLayout (`layout/tab-layout.ts`)

One per window. Tracks:

- **`activeNodeMap`** — Which `TabLayoutNode` is visible per space
- **`focusedTabMap`** — Which tab each space "wants" (used by STAW for cross-window state)
- **`activationHistory`** — Stack of previously active nodes per space (for smart tab-switching on close)

---

## Central Orchestrator: TabService (`tab-service.ts`)

The TabService is the single source of truth for all tab state. It coordinates:

1. **Tab creation/destruction** — Factory pattern with `createTab()` (public) and `createTabInternal()` (internal, skips profile loading)
2. **Activation** — `activateTab()` wakes sleeping tabs, sets active node, updates visibility, records history, notifies extensions
3. **Visibility management** — `updateTabVisibility()` shows/hides layers based on active node and space context
4. **Space/window transitions** — `moveTabToSpace()`, `setCurrentWindowSpace()`, `migrateTabBetweenLayouts()`
5. **Pinned tab operations** — Create, remove, click, double-click, reorder, cross-space relocation
6. **Event emission** — `structural-change`, `content-change`, `active-changed`, `focused-tab-changed`, `pinned-tab-changed`, `tab-created`, `tab-removed`

### Key Architectural Decisions

| Decision                                               | Rationale                                                                              |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Nullable view/webContents on Tab                       | Sleeping tabs hold no Electron resources; ~20-50MB saved per sleeping tab              |
| Counter-based tab IDs                                  | Deterministic, fast, no collision risk within a session                                |
| `TabOwnerRef` discriminated union                      | Future-proofs for bookmarks/collections owning tabs                                    |
| `focusedTabMap` separate from `activeNodeMap`          | STAW needs to know what a window "wants" even when the tab is physically elsewhere     |
| `runTabSyncMutation` queue                             | Serializes async STAW operations to prevent race conditions                            |
| Direct `extensions.ctx.store` patch for window mapping | `electron-chrome-extensions` has no public `moveTab()` API; contained to one code path |
| Profile guard on pinned tab relocation                 | Prevents cross-profile pinned tab moves when switching to a different profile's space  |

---

## Cross-Window Tab Sync (STAW) (`tab-sync.ts`)

When "Sync Tabs Across Windows" is enabled (or for pinned-tab-owned tabs unconditionally):

1. **Window focus** → `moveActiveTabToWindow()` moves the focused tab's view to the newly focused window
2. **Tab deactivation** → If another window still "wants" that tab (`focusedTabMap`), release it there
3. **Space change** → Reconcile placeholders, move focused tab to the current window

**Placeholder system:**

- Before moving a tab, a screenshot is captured via `webContents.capturePage()`
- Stored in-memory via `flow-internal://tab-snapshot` protocol
- Renderer shows the placeholder image at 50% opacity
- Cleared after 180ms when the real tab arrives or space changes

**Key utility:** `isTabSynced(tab)` — central predicate determining if a tab participates in sync (pinned-owned OR global sync enabled AND not excluded).

---

## Persistence (`persistence/`)

### TabPersistenceService

- **Dirty tracking:** Only modified tabs are written
- **Batch flush:** Every 2 seconds, all dirty entries are upserted in a single SQLite transaction
- **Owner-aware:** Only `normal`-owned tabs are persisted; ephemeral (pinned-owned) tabs are excluded and stale records cleaned
- **Window state:** Persists window bounds alongside tabs for restoration
- **Layout nodes:** Multi-tab display groupings (glance/split) are persisted and restored

### Restore Flow (`saving/tabs/restore.ts`)

1. Load all persisted tabs
2. Filter: archive (delete) tabs inactive beyond threshold (seconds-based comparison)
3. Pre-load all required profiles
4. Create windows per `windowGroupId`, restoring bounds
5. Create all tabs with `asleep: true` (no views, no activation)
6. Restore layout nodes (multi-tab groupings)

---

## IPC Layer (`ipc/`)

### TabIPC

- **Debounced updates:** Structural and content changes are batched (80ms window) before sending to renderer
- **Sync-aware broadcasting:** When sync is enabled, structural changes go to ALL windows (they share the same tab list)
- **Serialization:** Tabs → `TabData`, nodes → `TabLayoutNodeData`, pinned → `PinnedTabData`

### Preload API

Exposes to renderer:

- Tab operations: create, close, switch, move, duplicate, mute, reload, etc.
- Navigation: back, forward, loadURL
- Pinned tabs: click, double-click, create, remove, reorder
- Layout: create groups (glance/split), disband
- Queries: get all tabs, focused tab IDs, active node IDs
- Subscriptions: `onTabsChanged`, `onPinnedTabsChanged`, `onPlaceholderChanged`

---

## LayerManager Integration

The `LayerManager` (per-window) manages view z-ordering and focus:

- Tab views are wrapped in `Layer` objects with z-index and focus priority
- **Deferred focus reallocation:** When a layer becomes hidden while the window is NOT focused, focus reallocation is deferred until the window regains focus. This prevents `webContents.focus()` from stealing OS focus.
- `layer.focus()` clears `_focusReallocatePending` — explicit focus assignment cancels any pending reallocation.

---

## Data Flow Diagrams

### Tab Activation

```
User clicks tab in sidebar
  → IPC: "tab-service:switch-to-tab"
  → TabService.activateTab(tab)
    → tab.wakeUp() if asleep (creates view, restores nav history)
    → layout.setActiveNode(spaceId, node)
      → updates activationHistory
      → sets focusedTab
      → emits "active-changed"
    → updateTabVisibility(windowId, spaceId)
      → show tabs in active node, hide others
    → extensions.selectTab(webContents)
    → tab.recordBrowsingHistoryOnActivationIfNeeded()
    → tab.layer.focus() if window is focused
```

### Space Switch

```
User switches to Space B in Window A
  → BrowserWindow.setCurrentSpace(spaceId)
    → Passes oldSpaceId to setCurrentWindowSpace()
    → TabService.setCurrentWindowSpace(window, spaceId, oldSpaceId)
      → Hide all tabs visible in the old space
      → Relocate pinned tabs (same profile) from other spaces/windows
      → Activate most recently active tab in new space (if no active node)
      → updateTabVisibility(windowId, spaceId)
      → Auto-PiP for tabs with playing video that became hidden
    → tab-sync: handleSpaceChange
      → Reconcile placeholders
      → Move focused tab to this window (if sync enabled)
```

### STAW Window Focus Transfer

```
User focuses Window B (tab physically in Window A)
  → windowsController "window-focused"
  → initTabSync handler
    → shouldSyncSharedActiveTab(windowB, spaceId) → true
    → runTabSyncMutation(async () => {
        captureTabScreenshot(tab)           // screenshot for Window A
        sendPlaceholderToRenderer(windowA)  // Window A shows thumbnail
        migrateTabBetweenLayouts(tab, windowB.id)
        prepareTabForWindowTransfer(tab)    // hide
        tab.setWindow(windowB)             // move layer, patch extensions store
        activateTab(tab)                   // show in Window B
      })
```

---

## Design Constraints & Known Limitations

1. **`electron-chrome-extensions` internal patch:** The library has no `moveTab(wc, newWindow)` API. We patch `store.tabToWindow` directly. If the library changes its internals, this breaks. Recommended: fork the library and expose a public method.

2. **Single live tab per pinned tab:** A pinned tab has exactly one associated `Tab` instance across all spaces/windows. This means switching spaces always moves (not duplicates) the tab.

3. **Counter-based IDs are session-scoped:** Tab IDs reset on restart. Persistence uses `uniqueId` (UUID) for cross-session identity.

4. **No undo for pinned tab removal:** `removePinnedTab` destroys the associated tab immediately. Could be improved with the recently-closed system.

5. **`batchMoveTabs` is simplified:** Used only for renderer-initiated drag-and-drop. Doesn't clear `focusedTabMap` or trigger STAW reconciliation (assumes renderer handles its own state refresh).

---

## Future Considerations

- **Tab Groups (folder-like):** `TabOwnerRef` is designed to support `{ kind: "group", groupId }` for tree-structured tab organization
- **Bookmark-owned tabs:** `{ kind: "bookmark", bookmarkId }` would allow bookmarks to "own" a live tab (like pinned tabs but with bookmark metadata)
- **Split view:** `TabLayoutNode` already supports the `"split"` mode enum; bounds calculation logic can be added
- **Tab search/filtering:** The `tabs` Map on TabService provides O(1) lookup; space-scoped queries use `getTabsInWindowSpace`
- **Vertical tabs:** Layout/rendering is purely a renderer concern; the service layer is agnostic to tab bar orientation

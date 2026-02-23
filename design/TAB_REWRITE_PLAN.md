# Tab System & Tab Saving Rewrite Plan

## Architecture Overview

### Guiding Principles

1. **Single Responsibility** -- each class/module owns one concern
2. **Unidirectional dependencies** -- `Tab` emits events, never calls `TabsController` methods directly
3. **Persistence is a separate layer** -- `Tab` doesn't know how it's saved; a `TabPersistenceManager` listens for changes and handles saving
4. **Runtime vs Persisted data is explicit** -- the type system enforces which fields are saved to disk
5. **Debounced batch saves** -- dirty tabs are flushed periodically (~2s) and on quit, not on every micro-change
6. **Extensibility** -- adding a new persisted property requires changes in 2 files: the type definition and the serialization function

### New File Structure

```
src/shared/types/tabs.ts                    -- Clean types (persisted vs runtime split)

src/main/controllers/tabs-controller/
  index.ts                                  -- TabsController (slim registry + orchestrator)
  tab.ts                                    -- Tab (state + WebContents lifecycle, no persistence)
  tab-layout.ts                             -- Tab layout/bounds/visibility/z-index
  tab-lifecycle.ts                          -- Sleep/wake, PiP, fullscreen
  bounds.ts                                 -- Spring physics (largely unchanged)
  context-menu.ts                           -- Web page context menu (largely unchanged)
  tab-groups/
    index.ts                                -- BaseTabGroup, TabGroup type
    glance.ts                               -- GlanceTabGroup
    split.ts                                -- SplitTabGroup

src/main/saving/tabs/
  index.ts                                  -- TabPersistenceManager (orchestrates saves)
  serialization.ts                          -- Tab/TabGroup <-> PersistedData conversion
  restore.ts                                -- Startup restore logic
  recently-closed.ts                        -- Recently closed tabs store

src/main/ipc/browser/tabs.ts               -- IPC handlers (thinner, delegates to controller)
```

---

## Phase 1: Type System Redesign

**File: `src/shared/types/tabs.ts`**

Split the monolithic `TabData` into persisted and runtime portions:

```typescript
export const TAB_SCHEMA_VERSION = 1;

export type NavigationEntry = { title: string; url: string };
export type TabGroupMode = "normal" | "glance" | "split";

// --- Persisted (saved to disk) ---
export type PersistedTabData = {
  schemaVersion: number;
  uniqueId: string;
  createdAt: number;
  lastActiveAt: number;
  position: number;
  profileId: string;
  spaceId: string;
  windowGroupId: string; // replaces windowId (logical group key, not runtime ID)
  title: string;
  url: string;
  faviconURL: string | null;
  muted: boolean;
  navHistory: NavigationEntry[];
  navHistoryIndex: number;
};

export type PersistedTabGroupData = {
  groupId: string; // string ID like "tg-0" (no collision with tab IDs)
  mode: Exclude<TabGroupMode, "normal">;
  profileId: string;
  spaceId: string;
  tabUniqueIds: string[]; // reference by uniqueId, not runtime webContents.id
  glanceFrontTabUniqueId?: string;
  position: number;
};

// --- Runtime (sent to renderer, not persisted) ---
export type TabData = PersistedTabData & {
  id: number; // webContents.id (runtime only)
  windowId: number; // current Electron window ID (runtime only)
  isLoading: boolean;
  audible: boolean;
  fullScreen: boolean;
  isPictureInPicture: boolean;
  asleep: boolean;
};

export type TabGroupData = {
  id: string; // string ID (was number)
  mode: TabGroupMode;
  profileId: string;
  spaceId: string;
  tabIds: number[];
  glanceFrontTabId?: number;
  position: number;
};

// --- Recently Closed ---
export type RecentlyClosedTabData = {
  closedAt: number;
  tabData: PersistedTabData;
  tabGroupData?: PersistedTabGroupData; // if it was part of a group
};

// --- Window state (unchanged shape, but tabGroup IDs are now strings) ---
export type WindowFocusedTabIds = { [spaceId: string]: number };
export type WindowActiveTabIds = { [spaceId: string]: number[] };
export type WindowTabsData = {
  tabs: TabData[];
  tabGroups: TabGroupData[];
  focusedTabIds: WindowFocusedTabIds;
  activeTabIds: WindowActiveTabIds;
};
```

**Key changes:**

- Transient fields (`isLoading`, `audible`, `fullScreen`, `isPictureInPicture`, `asleep`) removed from persisted data
- `id` (webContents.id) removed from persisted data (meaningless across restarts)
- `windowId` replaced by `windowGroupId` (a stable string for grouping tabs into windows on restore)
- Tab group IDs changed from `number` to `string` (eliminates the `tab.id + 999` collision hack)
- `schemaVersion` added for future migrations
- `RecentlyClosedTabData` type added
- `PersistedTabGroupData` added for tab group persistence
- `muted` stays in persisted data (user intent, unlike `audible` which is transient state)

---

## Phase 2: Tab Saving System Rewrite

Replace the current eager-save approach with a proper persistence manager.

### 2a. `TabPersistenceManager` (`src/main/saving/tabs/index.ts`)

A singleton that owns all tab persistence logic:

```
class TabPersistenceManager {
  private dirtyTabs: Set<string>          // uniqueIds of tabs needing save
  private dirtyGroups: boolean            // whether tab groups need save
  private flushInterval: NodeJS.Timer     // periodic flush (every 2 seconds)
  private tabsDataStore: DataStore
  private tabGroupsDataStore: DataStore
  private recentlyClosedStore: DataStore

  // Core methods
  markDirty(uniqueId: string): void       // add to dirty set (no I/O)
  markGroupsDirty(): void                 // flag groups for save
  flush(): Promise<void>                  // batch-write all dirty tabs + groups
  flushSync(): void                       // synchronous version for quit handler

  // Tab CRUD
  saveTab(tab: Tab): void                 // serialize + markDirty (NO disk I/O)
  removeTab(uniqueId: string): Promise<void>  // immediate delete
  loadAllTabs(): Promise<PersistedTabData[]>

  // Tab group CRUD
  saveTabGroups(groups: TabGroup[]): void
  loadAllTabGroups(): Promise<PersistedTabGroupData[]>

  // Recently closed
  addRecentlyClosed(data: RecentlyClosedTabData): Promise<void>
  getRecentlyClosed(): Promise<RecentlyClosedTabData[]>
  restoreRecentlyClosed(uniqueId: string): Promise<PersistedTabData | null>
  clearRecentlyClosed(): Promise<void>

  // Lifecycle
  destroy(): void                         // stop interval, final flush
}
```

**Key behaviors:**

- `saveTab()` serializes the tab into `PersistedTabData` and adds its `uniqueId` to the dirty set. **No disk I/O happens.**
- Every ~2 seconds, `flush()` reads the dirty set, builds a batch of `PersistedTabData`, and calls `DataStore.setMany()` (single file write for all dirty tabs).
- On quit, `flush()` is called synchronously to ensure all pending changes are saved.
- Sleep-mode handling: serialization always uses the tab's "real" URL/navHistory (stored as properties), never reads `webContents` data for sleeping tabs. This eliminates the fragile "recover from old data" pattern.
- Tab groups are serialized using `uniqueId` references (not runtime `webContents.id`), so they can be restored across restarts.

### 2b. Serialization (`src/main/saving/tabs/serialization.ts`)

```
function serializeTab(tab: Tab): PersistedTabData
function serializeTabForRenderer(tab: Tab): TabData
function serializeTabGroup(group: TabGroup): PersistedTabGroupData
function serializeTabGroupForRenderer(group: TabGroup): TabGroupData
```

All serialization logic lives here -- single source of truth. Adding a new persisted field means updating `serializeTab` and the `PersistedTabData` type. That's it.

### 2c. Restore (`src/main/saving/tabs/restore.ts`)

```
async function restoreSession(): Promise<void>
  // 1. Load persisted tabs from TabsDataStore
  // 2. Filter out archived tabs
  // 3. Group by windowGroupId
  // 4. Create BrowserWindows
  // 5. Create tabs (all asleep)
  // 6. Load persisted tab groups from TabGroupsDataStore
  // 7. Recreate tab groups using uniqueId -> runtime id mapping
```

The restore logic moves out of `saving/tabs.ts` into its own module. Tab group restoration is now supported -- groups are recreated from their persisted `tabUniqueIds` by resolving them to the newly-created runtime tab IDs.

### 2d. Recently Closed (`src/main/saving/tabs/recently-closed.ts`)

```
const MAX_RECENTLY_CLOSED = 25;

class RecentlyClosedManager {
  private store: DataStore

  add(tabData: PersistedTabData, groupData?: PersistedTabGroupData): Promise<void>
  getAll(): Promise<RecentlyClosedTabData[]>
  restore(uniqueId: string): Promise<PersistedTabData | null>  // removes from store
  clear(): Promise<void>
}
```

When a tab is destroyed (non-popup), its `PersistedTabData` is pushed to this store. The store is capped at 25 entries (FIFO). Restoring removes the entry from the store and creates a new tab from the persisted data.

### 2e. Save-on-quit

Update `src/main/controllers/quit-controller/handlers/before-quit.ts`:

```typescript
export async function beforeQuit(): Promise<boolean> {
  // Flush all pending tab saves
  await tabPersistenceManager.flush();

  // Existing session/cookie flush
  await flushSessionsData();

  return true;
}
```

---

## Phase 3: Tab Class Decomposition

Break the 995-line `Tab` god object into focused modules.

### 3a. New `Tab` class (`tab.ts`, ~350 lines)

The `Tab` class retains:

- Identity: `id`, `uniqueId`, `profileId`, `spaceId`
- WebContentsView creation and ownership
- State properties (title, url, favicon, etc.) with change detection
- Event emission (`updated`, `destroyed`, `focused`, `space-changed`, `window-changed`)
- `loadURL()`, `loadErrorPage()`
- `setWindow()`, `getWindow()`, `setSpace()`
- `destroy()`

**Removed from Tab:**

- All layout/bounds logic -> `TabLayoutManager`
- Sleep/wake, PiP, fullscreen -> `TabLifecycleManager`
- `saveTabToStorage()` calls -> persistence manager listens to `updated` events
- `createNewTab()` -> moved to `TabsController` (Tab emits a `"new-tab-requested"` event instead)
- Direct `tabsController` calls (no more circular dependency)

**State change tracking improvement:**

- Replace `JSON.stringify` nav history comparison with a simple index + length check (deep equality only when those differ)
- The `updateTabState()` method batches all changed keys into a single `emit("updated", changedKeys)` call (already does this, just removes the `saveTabToStorage()` call)

### 3b. `TabLayoutManager` (`tab-layout.ts`, ~150 lines)

Extracted from `Tab.updateLayout()`:

```
class TabLayoutManager {
  constructor(private tab: Tab, private boundsController: TabBoundsController)

  updateLayout(): void
    // - Sets view visibility
    // - Calculates bounds based on mode (normal/glance/split)
    // - Applies bounds via TabBoundsController
    // - Manages z-index
    // - Updates lastActiveAt

  show(): void
  hide(): void

  private calculateNormalBounds(pageBounds): Rectangle
  private calculateGlanceBounds(pageBounds, isFront): Rectangle
  private calculateSplitBounds(pageBounds, splitConfig): Rectangle
}
```

Instantiated and wired up by `TabsController` when creating a tab, not by the tab itself. The layout manager reads the tab's state but doesn't modify it directly -- it calls `tab.updateStateProperty()` for things like `visible` and `lastActiveAt`.

### 3c. `TabLifecycleManager` (`tab-lifecycle.ts`, ~120 lines)

Extracted from `Tab`:

```
class TabLifecycleManager {
  constructor(private tab: Tab)

  putToSleep(alreadyLoadedURL?: boolean): void
  wakeUp(): void

  setFullScreen(isFullScreen: boolean): boolean
  enterPictureInPicture(): Promise<boolean>
  exitPictureInPicture(): Promise<boolean>
}
```

Sleep/wake logic stays close to the same, but the lifecycle manager stores the "real" URL and navHistory before sleeping so we don't need the fragile "recover from old saved data" pattern. When a tab goes to sleep, the lifecycle manager stores `{ url, navHistory, navHistoryIndex }` in memory, and the serialization function uses these stored values instead of reading `webContents`.

### 3d. Breaking the circular dependency

Currently `Tab` calls:

- `this.tabsController.createTab()` (from `createNewTab()`)
- `this.tabsController.setActiveTab()` (from `createNewTab()`)
- `this.tabsController.createTabGroup()` (from `createNewTab()`)
- `this.tabsController.getTabGroupByTabId()` (from `updateLayout()`)

New approach:

- `createNewTab()` moves to `TabsController`. `Tab` emits a `"new-tab-requested"` event with the details, and `TabsController` handles it.
- `updateLayout()` moves to `TabLayoutManager`, which receives the `TabsController` reference at construction time (one-way dependency: layout -> controller, never controller -> layout).
- `Tab` no longer has a reference to `TabsController` at all. It only emits events.

---

## Phase 4: TabsController Refactor

### 4a. Slim down the controller (`index.ts`, ~400 lines)

The `TabsController` becomes a slim orchestrator that:

1. **Registry** -- `Map<number, Tab>` and `Map<string, TabGroup>` (tab group IDs are now strings)
2. **Creates tabs** -- factory method that wires up `Tab`, `TabLayoutManager`, `TabLifecycleManager`, and event listeners
3. **Handles tab events** -- listens to `tab.on("updated")`, `tab.on("destroyed")`, `tab.on("new-tab-requested")`, etc.
4. **Delegates persistence** -- calls `tabPersistenceManager.saveTab(tab)` on relevant changes (but this is just marking dirty, no I/O)
5. **Active/focused tab tracking** -- same logic, cleaned up
6. **Tab groups** -- creation, destruction, management
7. **Position normalization** -- add a `normalizePositions(spaceId)` method that reassigns integer positions 0, 1, 2, ... after reordering, preventing drift to negative infinity

### 4b. Event naming consistency

Standardize to past-tense, kebab-case:

- Tab events: `"state-updated"`, `"destroyed"`, `"focused"`, `"space-changed"`, `"window-changed"`, `"new-tab-requested"`
- TabsController events: `"tab-created"`, `"tab-updated"`, `"tab-removed"`, `"space-changed"`, `"active-tab-changed"`
- TabGroup events: `"tab-added"`, `"tab-removed"`, `"destroyed"` (not `"destroy"`)

### 4c. Handle `createNewTab` in controller

```typescript
// In TabsController, when wiring up a new tab:
tab.on("new-tab-requested", (url, disposition, constructorOptions, details) => {
  this.handleNewTabRequest(tab, url, disposition, constructorOptions, details);
});
```

The `handleNewTabRequest` method contains the logic currently in `Tab.createNewTab()`.

### 4d. Position normalization

```typescript
public normalizePositions(windowId: number, spaceId: string): void {
  const tabs = this.getTabsInWindowSpace(windowId, spaceId)
    .sort((a, b) => a.position - b.position);

  tabs.forEach((tab, index) => {
    if (tab.position !== index) {
      tab.position = index;
      this.persistenceManager.markDirty(tab.uniqueId);
    }
  });
}
```

Called after reorder operations and periodically (e.g., every 60s or after N reorders).

### 4e. Implement proper `destroy()`

Un-comment and fix the `destroy()` method. It should:

1. Stop the archive check interval
2. Destroy all tab groups
3. Destroy all tabs
4. Clear all maps
5. Emit `"destroyed"`

### 4f. Clean up dead code

- Remove commented-out `destroy()` method
- Remove `SplitTabGroup` stub (or implement it if desired; otherwise remove the mode entirely)
- Clean up `@ts-expect-error` suppressions by fixing the type hierarchy

---

## Phase 5: IPC + Preload Updates

### 5a. IPC handlers (`src/main/ipc/browser/tabs.ts`)

The IPC handlers become thin delegation layers. The serialization functions move to `saving/tabs/serialization.ts`.

New IPC channels:

- `tabs:get-recently-closed` -- returns `RecentlyClosedTabData[]`
- `tabs:restore-recently-closed` -- restores a tab from recently closed
- `tabs:clear-recently-closed` -- clears recently closed history
- `tabs:batch-move-tabs` -- accepts `Array<{tabId, newPosition}>` for efficient reordering (replaces N individual `moveTab` calls)

Updated IPC channels:

- `tabs:get-data` -- serialization uses new `serializeTabForRenderer` / `serializeTabGroupForRenderer`
- `tabs:show-context-menu` -- add "Reopen Closed Tab" option

### 5b. Flow API interface (`src/shared/flow/interfaces/browser/tabs.ts`)

Add new methods:

```typescript
interface FlowTabsAPI {
  // ... existing methods ...
  getRecentlyClosed(): Promise<RecentlyClosedTabData[]>;
  restoreRecentlyClosed(uniqueId: string): Promise<boolean>;
  clearRecentlyClosed(): Promise<void>;
  batchMoveTabs(moves: Array<{ tabId: number; newPosition: number }>): Promise<boolean>;
}
```

### 5c. Preload (`src/preload/index.ts`)

Add the new IPC channel bindings for the new API methods.

---

## Phase 6: Renderer Updates

### 6a. `TabsProvider` (`tabs-provider.tsx`)

**Fix synthetic group IDs:**

Replace `tab.id + 999` with string-prefixed IDs. Since tab group IDs are now strings, synthetic groups use `"s-${tab.uniqueId}"` -- zero collision risk.

```typescript
// Before (collision-prone)
id: tab.id + 999;

// After (safe)
id: `s-${tab.uniqueId}`;
```

**Remove dead code:**

- Remove `revalidate()` (never called)

**Type updates:**

- Update `TabGroup` type to use `id: string` instead of `id: number`

### 6b. Sidebar components

Update `SidebarTabGroups` and `SidebarTabDropTarget`:

- Drag-and-drop source data uses string `tabGroupId` instead of number
- Use `batchMoveTabs` IPC for reordering instead of N individual `moveTab` calls
- Fix loose equality (`!=` -> `!==`)

### 6c. Context menu ("Reopen Closed Tab")

Add to the sidebar tab context menu:

```typescript
new MenuItem({
  label: "Reopen Closed Tab",
  enabled: hasRecentlyClosed,
  click: () => flow.tabs.restoreRecentlyClosed(mostRecentClosedTab.uniqueId)
});
```

### 6d. `BrowserContent` cleanup

Remove the dead `activeTabId = -1` and the never-triggering `AnimatePresence` block.

---

## Phase 7: Integration & Migration

### 7a. Data migration

On first launch with the new code:

1. Read the old `tabs.json` format
2. Detect missing `schemaVersion` field -> treat as version 0
3. Transform to version 1:
   - Add `schemaVersion: 1`
   - Rename `windowId` to `windowGroupId` (convert number to `"w-${windowId}"` string)
   - Remove transient fields (`isLoading`, `audible`, `fullScreen`, `isPictureInPicture`, `asleep`, `id`)
4. Write back in new format

This happens transparently in `TabPersistenceManager.loadAllTabs()`.

### 7b. Wiring it all together

In the application bootstrap:

1. Create `TabPersistenceManager` singleton
2. Create `RecentlyClosedManager` singleton
3. Create `TabsController` singleton (receives persistence manager)
4. Register IPC handlers
5. Call `restoreSession()` to load tabs from storage

In `TabsController.internalCreateTab()`:

```typescript
const tab = new Tab(details, options);
const lifecycle = new TabLifecycleManager(tab);
const layout = new TabLayoutManager(tab, this);

// Wire events
tab.on("state-updated", (keys) => {
  this.persistenceManager.saveTab(tab); // just marks dirty
  this.emit("tab-updated", tab);
});

tab.on("destroyed", () => {
  this.removeTab(tab);
  this.persistenceManager.removeTab(tab.uniqueId);
  if (shouldSaveToRecentlyClosed) {
    this.recentlyClosedManager.add(serializeTab(tab));
  }
});

tab.on("new-tab-requested", (...args) => {
  this.handleNewTabRequest(tab, ...args);
});
```

### 7c. Testing approach

- Manual testing of tab creation, switching, closing, reordering
- Verify tabs survive restart (with correct URL, title, favicon, position)
- Verify tab groups survive restart
- Verify recently closed tabs can be restored
- Verify sleep/wake still works
- Verify drag-and-drop reordering
- Verify cross-space tab moves
- Verify archive/sleep timers
- Test with many tabs to confirm batch saves are performant
- Kill the app process and verify tabs are restored from last flush

---

## Summary of improvements

| Problem                                          | Solution                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| Tab is 995-line god object                       | Split into `Tab` + `TabLayoutManager` + `TabLifecycleManager`        |
| Every property change triggers full file rewrite | Dirty-tracking + batched flush every ~2s                             |
| Transient state saved to disk                    | Explicit `PersistedTabData` type excludes runtime-only fields        |
| Sleep-mode save recovery is fragile              | Lifecycle manager stores pre-sleep URL in memory                     |
| Circular Tab <-> TabsController dependency       | Tab emits events, controller listens                                 |
| `tab.id + 999` synthetic group ID collision      | String-based group IDs (`"tg-0"`, `"s-${uniqueId}"`)                 |
| Positions drift to negative infinity             | `normalizePositions()` after reorder ops                             |
| Tab groups not persisted                         | `PersistedTabGroupData` + dedicated datastore                        |
| No recently closed tabs                          | `RecentlyClosedManager` with max 25 entries                          |
| No save-on-quit                                  | `flush()` called in `beforeQuit` handler                             |
| No schema versioning                             | `schemaVersion` field + migration in loader                          |
| N IPC calls for reorder                          | `batchMoveTabs` single IPC                                           |
| JSON.stringify for nav history diff              | Length + index check first, deep compare only when needed            |
| No way to extend easily                          | Add field to `PersistedTabData` + update `serializeTab()` -- 2 files |
| Commented-out dead code everywhere               | Removed or implemented                                               |

## Guiding Principles

1. **Single Responsibility** -- each class/module owns one concern
2. **Unidirectional dependencies** -- `Tab` emits events, never calls `TabsController` methods directly
3. **Persistence is a separate layer** -- `Tab` doesn't know how it's saved; a `TabPersistenceManager` listens for changes
4. **Runtime vs Persisted data is explicit** -- the type system enforces which fields are saved to disk
5. **Debounced batch saves** -- dirty tabs are flushed periodically (~2s) and on quit, not on every micro-change
6. **Extensibility** -- adding a new persisted property requires changes in 2 files: the type definition and the serialization function

## New File Structure

```
src/shared/types/tabs.ts                    -- Clean types (persisted vs runtime split)

src/main/controllers/tabs-controller/
  index.ts                                  -- TabsController (slim registry + orchestrator)
  tab.ts                                    -- Tab (state + WebContents lifecycle, no persistence)
  tab-layout.ts                             -- Tab layout/bounds/visibility/z-index
  tab-lifecycle.ts                          -- Sleep/wake, PiP, fullscreen
  bounds.ts                                 -- Spring physics (largely unchanged)
  context-menu.ts                           -- Web page context menu (largely unchanged)
  tab-groups/
    index.ts                                -- BaseTabGroup, TabGroup type
    glance.ts                               -- GlanceTabGroup
    split.ts                                -- SplitTabGroup

src/main/saving/tabs/
  index.ts                                  -- TabPersistenceManager (orchestrates saves)
  serialization.ts                          -- Tab/TabGroup <-> PersistedData conversion
  restore.ts                                -- Startup restore logic
  recently-closed.ts                        -- Recently closed tabs store

src/main/ipc/browser/tabs.ts               -- IPC handlers (thinner, delegates to controller)
```

---

## Checklist

### Phase 1: Type System Redesign

- [x] Split `TabData` into `PersistedTabData` (disk) and `TabData` (renderer)
- [x] Add `schemaVersion` to persisted data
- [x] Replace `windowId` with `windowGroupId` in persisted data
- [x] Remove transient fields from persisted type (`isLoading`, `audible`, `fullScreen`, `isPictureInPicture`, `asleep`, `id`)
- [x] Change tab group IDs from `number` to `string`
- [x] Add `PersistedTabGroupData` type
- [x] Add `RecentlyClosedTabData` type

### Phase 2: Tab Saving System Rewrite

- [x] Create `src/main/saving/tabs/` directory structure
- [x] Implement `TabPersistenceManager` with dirty-tracking and batch flush
- [x] Implement `serialization.ts` (serializeTab, serializeTabForRenderer, etc.)
- [x] Implement `restore.ts` (session restore with tab group support)
- [x] Implement `recently-closed.ts` (RecentlyClosedManager)
- [x] Add save-on-quit in `before-quit.ts`
- [x] Delete old `src/main/saving/tabs.ts` (blocked until Phase 3/4 rewires imports)

### Phase 3: Tab Class Decomposition

- [x] Extract layout logic into `TabLayoutManager` (`tab-layout.ts`)
- [x] Extract lifecycle logic into `TabLifecycleManager` (`tab-lifecycle.ts`)
- [x] Remove `saveTabToStorage()` calls from Tab
- [x] Move `createNewTab()` out of Tab -- emit `"new-tab-requested"` event
- [x] Remove direct `tabsController` calls from Tab
- [x] Replace JSON.stringify nav history comparison with smarter diff
- [x] Clean up Tab class to ~350 lines focused on state + WebContents

### Phase 4: TabsController Refactor

- [x] Handle `"new-tab-requested"` event from Tab
- [x] Wire up `TabLayoutManager` and `TabLifecycleManager` per tab
- [x] Integrate `TabPersistenceManager` (save on tab-updated, remove on destroyed)
- [x] Integrate `RecentlyClosedManager` (add on tab destroyed)
- [x] Add position normalization
- [x] Standardize event naming (past-tense, kebab-case)
- [x] Implement proper `destroy()` method
- [x] Remove dead/commented-out code
- [x] Change tab group IDs to strings

### Phase 5: IPC + Preload Updates

- [x] Update serialization calls to use new functions
- [x] Add `tabs:get-recently-closed` IPC
- [x] Add `tabs:restore-recently-closed` IPC
- [x] Add `tabs:clear-recently-closed` IPC
- [x] Add `tabs:batch-move-tabs` IPC
- [x] Update `FlowTabsAPI` interface with new methods
- [x] Update preload bindings
- [x] Add "Reopen Closed Tab" to sidebar context menu

### Phase 6: Renderer Updates

- [x] Fix synthetic group IDs (use `"s-${uniqueId}"` strings)
- [x] Update `TabGroup` type to use `id: string`
- [x] Update drag-and-drop to use string `tabGroupId`
- [x] Remove dead `revalidate()` code
- [x] Clean up `BrowserContent` dead code
- [x] Fix loose equality operators (`!=` -> `!==`)

### Phase 7: Integration & Migration

- [x] Add schema migration in persistence manager (v0 -> v1)
- [x] Wire everything together in bootstrap
- [x] Build and fix all type errors
- [ ] Manual testing pass

---

## Detailed Design Notes

### Type Split: Persisted vs Runtime

```
PersistedTabData (saved to disk):
  schemaVersion, uniqueId, createdAt, lastActiveAt, position,
  profileId, spaceId, windowGroupId,
  title, url, faviconURL, muted,
  navHistory, navHistoryIndex

TabData (sent to renderer = PersistedTabData + runtime fields):
  + id (webContents.id), windowId (runtime),
  + isLoading, audible, fullScreen, isPictureInPicture, asleep
```

### Persistence Flow

```
Tab state changes -> Tab emits "state-updated"
  -> TabsController hears it -> calls persistenceManager.markDirty(uniqueId)
  -> Every ~2s, persistenceManager.flush() batch-writes all dirty tabs
  -> On quit, flush() is called synchronously
```

### Tab Group IDs

```
Before: number (auto-increment), synthetic = tab.id + 999 (collision risk)
After:  string "tg-{n}", synthetic = "s-{uniqueId}" (no collision possible)
```

### Recently Closed

- Max 25 entries, FIFO
- Stored in separate datastore (`recently-closed.json`)
- Restored via IPC, removed from store on restore
- Context menu entry "Reopen Closed Tab" added

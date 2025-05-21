# TabManager Class Documentation

The `TabManager` class is a crucial component responsible for the overall management of tabs and tab groups within the Flow browser. It acts as a central coordinator for tab creation, destruction, grouping, and state management.

## Overview

`TabManager` orchestrates the lifecycle of all `Tab` instances and `TabGroup` instances. A key principle enforced by `TabManager` is that **every tab must belong to a tab group**. If a tab is not part of a user-defined group (like a "glance" or "split" group), `TabManager` ensures it resides in a default, single-tab `BaseTabGroup`. This guarantees consistency in tab handling and layout logic.

## Key Responsibilities

- **Tab Lifecycle:** Manages the creation and destruction of tabs. When a tab is created without a specific group, `TabManager` automatically creates a default `BaseTabGroup` to contain it.
- **Tab Group Lifecycle:**
    - Manages the creation and destruction of user-defined tab groups (e.g., `GlanceTabGroup`, `SplitTabGroup`).
    - Manages the lifecycle of default single-tab groups. These are created when a tab is born without a group and destroyed when the tab is moved to another group or is closed.
- **Tab Reassignment:** When a `TabGroup` is destroyed, `TabManager` reassigns all of its member tabs to new, individual default single-tab groups, ensuring no tab becomes "groupless".
- **Active State Management:** Tracks and manages the active tab and current space for each browser window.
- **State Synchronization:** Propagates state changes (e.g., active tab, window layout) to the relevant UI components.

## Tab Group Association

`TabManager` upholds the invariant that every `Tab` instance has a valid `groupId` referencing an existing `TabGroup`.

- **Default Single-Tab Groups:** When a tab is created without being explicitly added to a user-defined group, `TabManager` automatically instantiates a `BaseTabGroup` for it. This group typically contains only that single tab. Its lifecycle is tied to the tab: if the tab is closed, the group is destroyed; if the tab is moved to a user-defined group, the now-empty default group is destroyed.
- **User-Defined Groups:** When groups like `GlanceTabGroup` or `SplitTabGroup` are created, tabs are moved from their previous groups (often default single-tab groups) into the new user-defined group. `TabManager` handles the cleanup of any old groups that become empty as a result.

## Key Methods

- **`createTab(windowId?: number, profileId?: string, spaceId?: string, webContentsViewOptions?: Electron.WebContentsViewConstructorOptions, tabCreationOptions: Partial<TabCreationOptions> = {})`**
  - Asynchronously creates a new tab.
  - Determines the appropriate `windowId`, `profileId`, and `spaceId` if not provided.
  - Calls `internalCreateTab` to perform the actual tab and default group creation.
  - Example: `tabManager.createTab(window.id, 'default', 'work');`

- **`internalCreateTab(windowId: number, profileId: string, spaceId: string, webContentsViewOptions?: Electron.WebContentsViewConstructorOptions, tabCreationOptions: Partial<TabCreationOptions> = {})`**
  - Synchronously creates a `Tab` instance.
  - If `tabCreationOptions.groupId` is not provided, it generates a new `groupId`, creates a new `BaseTabGroup` for the tab with this ID, and adds this group to its internal `tabGroups` map.
  - The `Tab` is constructed with the determined `groupId`.
  - This method is primarily for internal use or when synchronous creation is necessary.

- **`removeTab(tab: Tab)`**
  - Removes a tab from the manager (e.g., when the tab is closed/destroyed).
  - Removes the tab from its current `TabGroup`.
  - If the tab's `TabGroup` becomes empty as a result, that group is then destroyed by `TabManager`.

- **`createTabGroup(mode: TabGroupMode, initialTabIds: [number, ...number[]]): TabGroup`**
  - Creates a user-defined tab group (e.g., "glance", "split").
  - For each tab in `initialTabIds`:
    - The tab is moved from its `oldGroup` (which is often a default single-tab group).
    - The `oldGroup` is destroyed if it becomes empty.
  - The new `TabGroup` is created with the specified tabs, and its `groupId` is assigned to these tabs.
  - A `'destroy'` listener is attached to the new group to ensure its tabs are reassigned if the group is later destroyed.

- **`destroyTabGroup(tabGroupId: number)`**
  - Destroys the specified `TabGroup`.
  - Crucially, all tabs that were members of the destroyed group are reassigned to new, individual default single-tab `BaseTabGroup` instances. This ensures no tab becomes orphaned.
  - The group's own `destroy()` method is called, which emits a `'destroy'` event handled by `TabManager` to perform the tab reassignment and cleanup.

- **`getTabById(tabId: number): Tab | undefined`**
  - Retrieves a `Tab` instance by its ID.

- **`getTabGroupByTabId(tabId: number): TabGroup | undefined`**
  - Retrieves the `TabGroup` that a specific tab belongs to.
  - Since every tab is guaranteed to have a group, this method (barring inconsistent states) will always return a `TabGroup`.

- **`getActiveTab(windowId: number, spaceId: string): Tab | TabGroup | undefined`**
  - Gets the currently active tab or tab group for a given window and space.

- **`setActiveTab(tabOrGroup: Tab | TabGroup)`**
  - Sets the specified tab or tab group as the active one for its window and space.
  - This triggers UI updates and layout changes.

- **`setCurrentWindowSpace(windowId: number, spaceId: string)`**
  - Sets the currently visible space for a given window. This also triggers updates to show the active tab/group within that space.

## Events

`TabManager` emits several events to signal changes in the tabscape:

- **`tab-created`: `[Tab]`** - Emitted when a new tab has been created and initialized.
- **`tab-removed`: `[Tab]`** - Emitted when a tab has been removed and destroyed.
- **`tab-changed`: `[Tab]`** - Emitted when properties of a tab (e.g., `spaceId`, `windowId`, or properties updated via `tab.on('updated')`) have changed.
- **`current-space-changed`: `[windowId: number, spaceId: string]`** - Emitted when the active space in a window changes.
- **`active-tab-changed`: `[windowId: number, spaceId: string]`** - Emitted when the active tab or tab group changes within a window's current space.
- **`destroyed`: `[]`** - Emitted when the `TabManager` itself is destroyed.

These events are critical for other parts of the application (like the UI) to react to changes in tab and group states.

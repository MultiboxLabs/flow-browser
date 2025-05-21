# Tab Groups Documentation

Tab groups are a fundamental concept in Flow browser for organizing and managing sets of related tabs. They can provide special layout behaviors (like glance or split views) or simply act as logical containers. The `TabManager` ensures that every tab is always part of a tab group.

## Overview

The primary purposes of tab groups are:
- **Organization:** To group related tabs together, improving workspace management.
- **Special Layouts:** To enable specific UI presentations, such as:
    - `GlanceTabGroup`: Allows quickly glancing at a secondary tab while keeping a primary tab in view.
    - `SplitTabGroup`: (Conceptual) Would allow viewing multiple tabs side-by-side within the same window space.
- **Consistent Tab Management:** By ensuring every tab belongs to a group, even if it's a default group containing just that single tab, the `TabManager` can apply consistent logic for tab handling, activation, and layout.

## `BaseTabGroup` Class

`BaseTabGroup` is the foundational class for all types of tab groups. It provides the core functionality for managing a collection of tabs. Specific group types like `GlanceTabGroup` extend `BaseTabGroup` to add specialized behaviors.

### Key Properties

- `id`: (Readonly `number`) The unique ID of the tab group.
- `isDestroyed`: (`boolean`) Indicates if the group has been destroyed.
- `windowId`: (`number`) The ID of the browser window this group belongs to.
- `profileId`: (`string`) The ID of the profile this group is associated with.
- `spaceId`: (`string`) The ID of the space this group belongs to.
- `tabs`: (Readonly `Tab[]`) An array of `Tab` objects that are members of this group. This is a getter that maps `tabIds` to `Tab` instances via `TabManager`.
- `tabIds`: (Protected `number[]`) An array of tab IDs belonging to this group.

### Key Methods

- **`constructor(browser: Browser, tabManager: TabManager, id: number, initialTabs: [Tab, ...Tab[]])`**
  - Creates a new `BaseTabGroup`.
  - `browser` and `tabManager` are references to the main browser controllers.
  - `id` is the unique ID for this group.
  - `initialTabs` is an array containing at least one `Tab` to initialize the group. The group's `windowId`, `profileId`, and `spaceId` are derived from the first tab in this array.
  - Each tab in `initialTabs` will have its `groupId` property updated to this group's `id`.

- **`addTab(tabId: number): boolean`**
  - Adds the tab with the given `tabId` to this group.
  - Before adding, it ensures the tab is not already part of the group.
  - It updates the `tab.groupId` to this group's `id`.
  - Sets up event listeners to manage the tab's lifecycle within the group (e.g., removing the tab if it's destroyed).
  - Returns `true` if the tab was successfully added, `false` otherwise (e.g., tab not found).

- **`removeTab(tabId: number): boolean`**
  - Removes the tab with the given `tabId` from this group's internal list (`this.tabIds`).
  - **Important:** This method itself *does not* change `tab.groupId`. The `TabManager` is responsible for the subsequent state of the tab. For example:
    - If the tab is being moved to another group, `TabManager` will handle updating its `groupId`.
    - If the tab is being closed, `TabManager` will handle its destruction and potentially the destruction of this group if it becomes empty.
  - Emits a `tab-removed` event.
  - Returns `true` if the tab was successfully removed from the group's list, `false` otherwise.

- **`setSpace(spaceId: string)`**
  - Moves the entire group and all its member tabs to the specified `spaceId`.
  - Updates `this.spaceId` and calls `tab.setSpace()` for each tab in the group.

- **`setWindow(windowId: number)`**
  - Moves the entire group and all its member tabs to the browser window with the specified `windowId`.
  - Updates `this.windowId` and calls `tab.setWindow()` for each tab in the group.

- **`destroy()`**
  - Marks the group as destroyed (`this.isDestroyed = true`).
  - Emits a `destroy` event. This event is crucial for `TabManager`.
  - **Tab Reassignment:** When `TabManager` handles the `destroy` event of a group, it reassigns all member tabs of the destroyed group to new, individual default single-tab groups. This ensures no tab becomes "groupless".
  - Cleans up its own event listeners.

### Events

- **`tab-added`: `[tabId: number]`** - Emitted when a tab is successfully added to the group.
- **`tab-removed`: `[tabId: number]`** - Emitted when a tab is removed from the group's list.
- **`space-changed`: `[]`** - Emitted when the group's `spaceId` changes.
- **`window-changed`: `[]`** - Emitted when the group's `windowId` changes.
- **`destroy`: `[]`** (Potentially `[tabsInGroup: Tab[]]`) - Emitted when the group's `destroy()` method is called. `TabManager` listens to this to manage tab reassignment and cleanup.

## Specific Group Types

While `BaseTabGroup` provides common functionality, specific group types extend it:

- **`GlanceTabGroup`:** Extends `BaseTabGroup` to manage a "front" tab and other "back" tabs, allowing for quick peeking. It has additional methods like `setFrontTab(tabId: number)`.
- **`SplitTabGroup`:** (Conceptual) Would extend `BaseTabGroup` to manage tabs in a side-by-side split view.

### Default Single-Tab Groups

- These are standard `BaseTabGroup` instances that play a vital role in ensuring every tab is always associated with a group.
- **Creation:** `TabManager` automatically creates a default single-tab group for any tab that is created without being explicitly assigned to a user-defined group (e.g., a glance or split group).
- **Content:** Typically, such a group contains only one tab.
- **Lifecycle:**
    - When its single tab is closed, `TabManager` ensures this now-empty default group is also destroyed.
    - When its single tab is moved into a user-created group (e.g., added to a `GlanceTabGroup`), `TabManager` destroys this now-empty default group.
    - If a user-created group is destroyed, its member tabs are each moved into new, individual default single-tab groups created by `TabManager`.

## Lifecycle and `TabManager`

The lifecycle of tab groups is intrinsically linked with `TabManager`:

1.  **Creation:**
    - User-defined groups (e.g., `GlanceTabGroup`) are created via `TabManager.createTabGroup(...)`. `TabManager` handles moving tabs from their old groups (often default groups) into the new user group and cleaning up any old groups that become empty.
    - Default single-tab groups are created automatically by `TabManager.internalCreateTab(...)` whenever a tab is born without a pre-assigned group.

2.  **Tab Management:**
    - Adding/removing tabs from a group might affect the group's state (e.g., becoming empty). `TabManager` observes these changes (often via events or direct calls after `group.removeTab()`) and can trigger group destruction if necessary.

3.  **Destruction:**
    - Groups can be destroyed by calling `TabManager.destroyTabGroup(groupId)`.
    - A group might also be destroyed if it becomes empty (e.g., its last tab is closed or moved).
    - When any group is destroyed, `TabManager` ensures that all tabs previously belonging to it are reassigned to new default single-tab groups. This is a critical step to maintain the "every tab has a group" invariant. The group emits a `destroy` event, which `TabManager` listens for to trigger this reassignment logic.

This tight coordination ensures that the tab and group system remains consistent and robust.

# Tab Group API Documentation

## Overview

The Tab Group system provides a way to organize and manage collections of tabs within the Flow browser. Tab groups can contain multiple tabs and provide functionality for managing focus, window assignment, and tab lifecycle within the group.

## Core Components

### TabGroup Class

The main `TabGroup` class is the central component that orchestrates tab management through specialized controllers.

#### Constructor

```typescript
constructor(variant: TabGroupVariant, details: TabGroupCreationDetails)
```

Creates a new tab group with the specified variant and creation details.

#### Properties

- `id: string` - Unique identifier for the tab group
- `destroyed: boolean` - Whether the tab group has been destroyed
- `type: TabGroupTypes` - The type of tab group ("normal", "split", or "glance")
- `maxTabs: number` - Maximum number of tabs allowed in the group (-1 for unlimited)
- `creationDetails: TabGroupCreationDetails` - Details used to create the tab group
- `window: TabGroupWindowController` - Controller for managing the window
- `tabs: TabGroupTabsController` - Controller for managing tabs
- `focusedTab: TabGroupFocusedTabController` - Controller for managing focused tab

#### Methods

- `destroy()` - Destroys the tab group and cleans up all resources
- `throwIfDestroyed()` - Throws an error if the tab group has been destroyed

#### Events

The `TabGroup` class extends `TypedEventEmitter` and emits the following events:

- `"window-changed"` - Emitted when the tab group's window changes
- `"tab-added"` - Emitted when a tab is added to the group
- `"tab-removed"` - Emitted when a tab is removed from the group
- `"destroyed"` - Emitted when the tab group is destroyed

## Controllers

### TabGroupTabsController

Manages the collection of tabs within a tab group.

#### Methods

- `addTab(tab: Tab): boolean` - Adds a tab to the group

  - Returns `false` if the tab is already in the group or would exceed maxTabs
  - Sets up event listeners for tab lifecycle management
  - Emits "tab-added" event

- `removeTab(tab: Tab): boolean` - Removes a tab from the group

  - Returns `false` if the tab is not in the group
  - Cleans up event listeners to prevent memory leaks
  - Emits "tab-removed" event

- `get(): Tab[]` - Returns all tabs currently in the group

  - Filters out destroyed tabs automatically

- `cleanupListeners()` - Cleans up all event listeners for all tabs

#### Behavior

- Automatically destroys the tab group when the last tab is removed
- Respects the `maxTabs` limit when adding tabs
- Maintains event listeners for tab destruction and focus events
- Provides O(1) tab lookup using internal Set data structure

### TabGroupFocusedTabController

Manages which tab is currently focused within the tab group.

#### Methods

- `set(tab: Tab): boolean` - Sets the focused tab

  - Returns `false` if the tab is already focused
  - Automatically removes the previous focused tab

- `remove(): boolean` - Removes the currently focused tab
  - Returns `false` if no tab was focused

#### Behavior

- Automatically sets focus to the first tab when a tab is added to an empty group
- Automatically reassigns focus when the focused tab is removed
- Listens for "tab-added" and "tab-removed" events to manage focus

### TabGroupWindowController

Manages the window that contains the tab group.

#### Methods

- `get(): TabbedBrowserWindow` - Returns the current window
- `set(window: TabbedBrowserWindow): boolean` - Sets the window

  - Returns `false` if the window is already set
  - Emits "window-changed" event
  - Updates all tabs in the group to use the new window

- `updateTabsWindow()` - Updates all tabs in the group to use the current window

## Types and Interfaces

### TabGroupTypes

```typescript
type TabGroupTypes = "normal" | "split" | "glance";
```

Defines the available tab group types:

- `"normal"` - Standard tab group with configurable tab limit
- `"split"` - Tab group designed for split-screen functionality
- `"glance"` - Tab group for quick preview/glance functionality

### TabGroupVariant

```typescript
interface TabGroupVariant {
  type: TabGroupTypes;
  maxTabs: number;
}
```

Specifies the variant configuration for a tab group:

- `type` - The type of tab group
- `maxTabs` - Maximum number of tabs allowed (-1 for unlimited)

### TabGroupCreationDetails

```typescript
interface TabGroupCreationDetails {
  browser: Browser;
  window: TabbedBrowserWindow;
  spaceId: string;
}
```

Contains the details needed to create a tab group:

- `browser` - The browser instance that owns the tab group
- `window` - The initial window for the tab group
- `spaceId` - The space ID where the tab group belongs

## Specialized Tab Group Types

### NormalTabGroup

A specialized tab group that can only contain one tab.

```typescript
class NormalTabGroup extends TabGroup {
  constructor(details: TabGroupCreationDetails) {
    super({ type: "normal", maxTabs: 1 }, details);
  }
}
```

## Usage Examples

### Creating a Tab Group

```typescript
import { TabGroup } from "@/browser/tabs/tab-group";

const tabGroup = new TabGroup(
  { type: "normal", maxTabs: 5 },
  {
    browser: browserInstance,
    window: windowInstance,
    spaceId: "space-123"
  }
);
```

### Adding Tabs to a Group

```typescript
const success = tabGroup.tabs.addTab(tab);
if (success) {
  console.log("Tab added successfully");
} else {
  console.log("Failed to add tab (already exists or exceeds limit)");
}
```

### Listening for Events

```typescript
tabGroup.connect("tab-added", (tab) => {
  console.log("Tab added:", tab.id);
});

tabGroup.connect("tab-removed", (tab) => {
  console.log("Tab removed:", tab.id);
});

tabGroup.connect("window-changed", () => {
  console.log("Window changed for tab group");
});
```

### Managing Focus

```typescript
// Set focused tab
tabGroup.focusedTab.set(tab);

// Remove focused tab
tabGroup.focusedTab.remove();
```

### Changing Window

```typescript
tabGroup.window.set(newWindow);
```

### Destroying a Tab Group

```typescript
tabGroup.destroy();
```

## Error Handling

The tab group system includes several error handling mechanisms:

- `throwIfDestroyed()` - Prevents operations on destroyed tab groups
- Event listener cleanup to prevent memory leaks
- Automatic filtering of destroyed tabs in `get()` method
- Graceful handling of tab limits in `addTab()`

## Implementation Notes

- Tab groups use a Set-based data structure for O(1) tab lookup performance
- Event listeners are automatically cleaned up when tabs are removed
- The system is designed to be memory-efficient and prevent leaks
- Tab groups automatically destroy themselves when they become empty
- Focus management is handled automatically based on tab addition/removal events

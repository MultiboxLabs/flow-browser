# Tab API Documentation

The `Tab` class is the core component that manages individual browser tabs in the Flow Browser. It provides a comprehensive interface for tab management, including webview handling, navigation, bounds management, and various tab-specific features.

## Overview

The Tab class extends `TypedEventEmitter` and orchestrates multiple controllers to handle different aspects of tab functionality. Each tab represents a single browsing context with its own webview, navigation history, and state management.

## Class Structure

```typescript
class Tab extends TypedEventEmitter<TabEvents>
```

### Properties

#### Core Properties

- `id: string` - Unique identifier for the tab
- `loadedProfile: LoadedProfile` - The profile this tab belongs to
- `creationDetails: TabCreationDetails` - Details used to create the tab
- `destroyed: boolean` - Whether the tab has been destroyed
- `browser: Browser` - Reference to the parent browser instance
- `profileId: string` - ID of the profile this tab belongs to

#### Controllers

The Tab class manages various controllers that handle specific aspects of tab functionality:

- `window: TabWindowController` - Manages tab window assignment
- `data: TabDataController` - Handles tab data and state synchronization
- `bounds: TabBoundsController` - Manages tab positioning and sizing
- `visiblity: TabVisiblityController` - Controls tab visibility
- `webview: TabWebviewController` - Manages the webview component
- `pip: TabPipController` - Handles Picture-in-Picture functionality
- `saving: TabSavingController` - Manages tab saving operations
- `contextMenu: TabContextMenuController` - Handles context menu functionality
- `errorPage: TabErrorPageController` - Manages error page display
- `navigation: TabNavigationController` - Handles navigation and history
- `sleep: TabSleepController` - Manages tab sleep/wake functionality

## Creation Details

### TabCreationDetails Interface

```typescript
interface TabCreationDetails {
  browser: Browser;
  window: TabbedBrowserWindow;
  tabId?: string;
  loadedProfile: LoadedProfile;
  webContentsViewOptions: Electron.WebContentsViewConstructorOptions;
  navHistory?: NavigationEntry[];
  navHistoryIndex?: number;
  defaultURL?: string;
  asleep?: boolean;
}
```

## Events

The Tab class emits the following events:

- `"window-changed"` - Emitted when the tab's window changes
- `"webview-attached"` - Emitted when the webview is attached
- `"webview-detached"` - Emitted when the webview is detached
- `"pip-active-changed"` - Emitted when Picture-in-Picture state changes
- `"bounds-changed"` - Emitted when tab bounds change
- `"visiblity-changed"` - Emitted when tab visibility changes
- `"sleep-changed"` - Emitted when tab sleep state changes
- `"nav-history-changed"` - Emitted when navigation history changes
- `"data-changed"` - Emitted when tab data changes
- `"focused"` - Emitted when the tab gains focus
- `"destroyed"` - Emitted when the tab is destroyed

## Methods

### Core Methods

#### `destroy()`

Destroys the tab and cleans up resources.

- Detaches the webview
- Emits the "destroyed" event
- Destroys the event emitter

#### `throwIfDestroyed()`

Throws an error if the tab has already been destroyed.

## Controllers Documentation

### TabBoundsController

Manages tab positioning and sizing.

#### Properties

- `isAnimating: boolean` - Whether the tab is currently animating

#### Methods

- `startAnimating()` - Starts animation mode
- `stopAnimating()` - Stops animation mode
- `set(bounds: PageBounds)` - Sets tab bounds
- `get()` - Gets current bounds
- `updateWebviewBounds()` - Updates webview bounds based on visibility

### TabDataController

Handles tab data synchronization and state management.

#### Properties

- `window: TabbedBrowserWindow | null` - Current window
- `pipActive: boolean` - Picture-in-Picture state
- `asleep: boolean` - Sleep state
- `title: string` - Tab title
- `url: string` - Current URL
- `isLoading: boolean` - Loading state
- `audible: boolean` - Audio state
- `muted: boolean` - Muted state

#### Methods

- `refreshData()` - Refreshes all tab data
- `setupWebviewData(webContents)` - Sets up webview event listeners
- `get()` - Returns complete tab data object

### TabNavigationController

Manages tab navigation and history.

#### Properties

- `navHistory: NavigationEntry[]` - Navigation history
- `navHistoryIndex: number` - Current history index

#### Methods

- `setupWebviewNavigation(webContents)` - Sets up navigation for webview
- `syncNavHistory()` - Synchronizes navigation history
- `loadUrl(url, replace?)` - Loads a URL, optionally replacing current entry

### TabWebviewController

Manages the webview component.

#### Properties

- `webContentsView: WebContentsView | null` - The webview component
- `webContents: WebContents | null` - The webview's web contents
- `attached: boolean` - Whether webview is attached

#### Methods

- `attach()` - Attaches the webview
- `detach()` - Detaches and destroys the webview

### TabWindowController

Manages tab window assignment.

#### Methods

- `get()` - Gets current window
- `set(window)` - Sets the tab's window
- `updateWebviewWindow()` - Updates webview window assignment

### TabVisiblityController

Controls tab visibility.

#### Properties

- `isVisible: boolean` - Current visibility state

#### Methods

- `setVisible(visible)` - Sets tab visibility
- `updateWebviewVisiblity()` - Updates webview visibility

### TabPipController

Handles Picture-in-Picture functionality.

#### Properties

- `active: boolean` - Whether PiP is active

#### Methods

- `tryEnterPiP()` - Attempts to enter Picture-in-Picture mode
- `tryExitPiP()` - Attempts to exit Picture-in-Picture mode

### TabSleepController

Manages tab sleep/wake functionality.

#### Properties

- `asleep: boolean` - Whether the tab is asleep

#### Methods

- `putToSleep()` - Puts the tab to sleep
- `wakeUp()` - Wakes up the tab

### TabContextMenuController

Handles context menu functionality for tabs. Automatically sets up context menus when the webview is attached.

### TabErrorPageController

Manages error page display when navigation fails.

#### Methods

- `loadErrorPage(errorCode, url)` - Loads an error page for failed navigation

### TabSavingController

Manages tab saving operations (currently minimal implementation).

## Usage Example

```typescript
import { Tab, TabCreationDetails } from "@/browser/tabs/tab";

// Create tab creation details
const creationDetails: TabCreationDetails = {
  browser: browserInstance,
  window: tabbedWindow,
  loadedProfile: profile,
  webContentsViewOptions: {},
  defaultURL: "https://example.com"
};

// Create a new tab
const tab = new Tab(creationDetails);

// Set up event listeners
tab.on("data-changed", () => {
  console.log("Tab data changed");
});

tab.on("focused", () => {
  console.log("Tab focused");
});

// Manage tab visibility
tab.visiblity.setVisible(true);

// Load a URL
tab.navigation.loadUrl("https://example.com");

// Access tab data
const tabData = tab.data.get();
console.log("Tab title:", tabData.title);
console.log("Tab URL:", tabData.url);

// Clean up
tab.destroy();
```

## Integration

The Tab class integrates with:

- **Browser**: Parent browser instance that manages multiple tabs
- **TabbedBrowserWindow**: Window that displays the tab
- **LoadedProfile**: Profile that provides session and extensions
- **WebContentsView**: Electron's webview component for rendering web content

## Best Practices

1. Always call `destroy()` when a tab is no longer needed
2. Use `throwIfDestroyed()` before performing operations on tabs
3. Listen to appropriate events for state synchronization
4. Use the controller APIs rather than directly manipulating internal state
5. Handle webview attachment/detachment properly for performance

# Tab Class Documentation

The `Tab` class represents a single tab within the Flow browser. It manages the web content (`WebContentsView`), state, layout, and lifecycle of a browser tab.

## Overview

- **Manages Web Content:** Each `Tab` instance encapsulates an Electron `WebContentsView` and its associated `WebContents` object, responsible for rendering web pages.
- **State Management:** Tracks various states like URL, title, loading status, audio status, and visibility.
- **Layout Control:** Supports different layouts (`normal`, `glance`, `split`) and updates the view bounds accordingly.
- **Lifecycle:** Handles creation, showing/hiding, and destruction of the tab.
- **Events:** Emits events for focus changes, updates, and destruction.

## Creating a Tab

A `Tab` instance is typically created by the `TabManager`. The constructor requires `TabCreationDetails` and `TabCreationOptions`.

```typescript
// Simplified example - Usually done within TabManager
const tab = new Tab(
  {
    browser: browserInstance,
    tabManager: tabManagerInstance,
    profileId: "default",
    spaceId: "main",
    session: electronSession
  },
  {
    window: browserWindowInstance, // Optional: Assign to a window immediately
    webContentsViewOptions: {
      /* ... */
    } // Optional: Customize WebContentsView
  }
);
```

### `TabCreationDetails`

- `browser`: The main `Browser` controller instance.
- `tabManager`: The `TabManager` instance responsible for this tab.
- `profileId`: The ID of the user profile associated with this tab.
- `spaceId`: The ID of the space this tab belongs to.
- `session`: The Electron `Session` object to use for this tab's web content.

### `TabCreationOptions`

- `window`: (Optional) The `TabbedBrowserWindow` to initially attach the tab to.
- `webContentsViewOptions`: (Optional) Electron `WebContentsViewConstructorOptions` to customize the underlying view and web preferences.

## Key Properties

- `id`: (Readonly `number`) The unique ID of the tab's `WebContents`.
- `profileId`: (Readonly `string`) The associated profile ID.
- `spaceId`: (`string`) The associated space ID. Can be updated.
- `visible`: (`boolean`) Whether the tab's view is currently visible.
- `isDestroyed`: (`boolean`) Whether the tab has been destroyed.
- `layout`: (`TabLayout`) The current layout configuration (e.g., `{ type: 'normal' }`).
- `faviconURL`: (`string | null`) The URL of the current favicon.
- `title`: (`string`) The current page title.
- `url`: (`string`) The current page URL.
- `isLoading`: (`boolean`) Whether the page is currently loading.
- `audible`: (`boolean`) Whether the tab is currently playing audio.
- `muted`: (`boolean`) Whether the tab's audio is muted.
- `view`: (Readonly `PatchedWebContentsView`) The Electron `WebContentsView` instance.
- `webContents`: (Readonly `WebContents`) The Electron `WebContents` instance associated with the view.

## Key Methods

- `setWindow(window: TabbedBrowserWindow | null)`: Attaches the tab's view to a given window or detaches it if `null` is passed.
- `loadURL(url: string, replace?: boolean)`: Loads the specified URL in the tab. If `replace` is true, it attempts to replace the current history entry.
- `loadErrorPage(errorCode: number, url: string)`: Loads a custom error page for the given error code and original URL.
- `setLayout(layout: TabLayout)`: Sets the tab's layout configuration and updates the view.
- `updateLayout()`: Recalculates and applies the view's bounds based on the current `layout` and window dimensions. Should be called when the window resizes or layout changes.
- `updateTabState()`: Reads the current state (title, URL, loading, audio) from `webContents` and updates the corresponding `Tab` properties. Emits an `updated` event if any state changed. Returns `true` if changed, `false` otherwise.
- `show()`: Makes the tab's view visible.
- `hide()`: Hides the tab's view.
- `destroy()`: Cleans up resources, removes the view, and marks the tab as destroyed. Emits the `destroyed` event.

## Events

The `Tab` class extends `TypedEventEmitter` and emits the following events:

- `focused`: Emitted when the tab's `webContents` gains focus. Used by `TabManager` to track the active tab.
- `updated`: Emitted when the tab's state (e.g., title, URL, loading status, favicon, visibility) changes, often triggered by internal calls to `updateTabState()` or methods like `show()`/`hide()`.
- `destroyed`: Emitted when the `destroy()` method is called and the tab is successfully cleaned up.

## Internal Helpers

- `createWebContentsView()`: Factory function used internally by the constructor to create the `WebContentsView` with appropriate web preferences (sandbox, preload script, session).
- `setupEventListeners()`: Sets up listeners on the `webContents` object to react to page events (focus, favicon updates, load failures, navigation, media playback) and trigger state updates or actions.

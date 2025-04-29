# Browser Class Documentation

The `Browser` class is the main controller that coordinates browser components in the application. It serves as the central hub for managing windows, profiles, and browser operations.

## Overview

The Browser class is responsible for:

- Coordinating window and profile management
- Handling lifecycle events
- Providing a unified API for browser operations

## Constructor

```typescript
new Browser();
```

Creates a new Browser instance and initializes the window and profile managers. Automatically creates the initial window after initialization.

## Properties

- `profileManager`: Manages browser profiles
- `windowManager`: Manages browser windows
- `_isDestroyed`: Indicates if the browser has been destroyed

## Profile Management Methods

### getLoadedProfile

```typescript
getLoadedProfile(profileId: string): LoadedProfile | undefined
```

Retrieves a loaded profile by its ID.

**Parameters:**

- `profileId`: The ID of the profile to retrieve

**Returns:**

- The loaded profile if found, undefined otherwise

### getLoadedProfiles

```typescript
getLoadedProfiles(): LoadedProfile[]
```

Retrieves all currently loaded profiles.

**Returns:**

- Array of all loaded profiles

### loadProfile

```typescript
loadProfile(profileId: string): Promise<boolean>
```

Loads a profile by ID and creates the first window if needed.

**Parameters:**

- `profileId`: The ID of the profile to load

**Returns:**

- Promise that resolves to true if the profile was loaded successfully, false otherwise

### unloadProfile

```typescript
unloadProfile(profileId: string): boolean
```

Unloads a profile by ID.

**Parameters:**

- `profileId`: The ID of the profile to unload

**Returns:**

- true if the profile was unloaded successfully, false otherwise

## Window Management Methods

### createWindow

```typescript
createWindow(
  type: BrowserWindowType = "normal",
  options: BrowserWindowCreationOptions = {}
): Promise<TabbedBrowserWindow>
```

Creates a new browser window.

**Parameters:**

- `type`: The type of window to create (default: "normal")
- `options`: Additional window creation options

**Returns:**

- Promise that resolves to the created TabbedBrowserWindow

### getWindows

```typescript
getWindows(): TabbedBrowserWindow[]
```

Retrieves all browser windows.

**Returns:**

- Array of all TabbedBrowserWindow instances

### getWindowById

```typescript
getWindowById(windowId: number): TabbedBrowserWindow | undefined
```

Retrieves a window by its ID.

**Parameters:**

- `windowId`: The ID of the window to retrieve

**Returns:**

- The TabbedBrowserWindow if found, undefined otherwise

### getWindowFromWebContents

```typescript
getWindowFromWebContents(webContents: WebContents): TabbedBrowserWindow | null
```

Retrieves a window from its WebContents.

**Parameters:**

- `webContents`: The WebContents instance to find the window for

**Returns:**

- The associated TabbedBrowserWindow if found, null otherwise

### destroyWindowById

```typescript
destroyWindowById(windowId: number): boolean
```

Destroys a window by its ID.

**Parameters:**

- `windowId`: The ID of the window to destroy

**Returns:**

- true if the window was destroyed successfully, false otherwise

## Lifecycle Methods

### checkIsDestroyed

```typescript
checkIsDestroyed(): boolean
```

Checks if the browser has been destroyed.

**Returns:**

- true if the browser has been destroyed, false otherwise

### destroy

```typescript
destroy(): void
```

Cleans up and destroys the browser instance. This method:

- Destroys all windows
- Unloads all profiles
- Marks as destroyed and emits a "destroy" event
- Cleans up the event emitter

**Throws:**

- Error if the browser has already been destroyed

## Tab Management

### getTabFromId

```typescript
getTabFromId(tabId: number): Tab | undefined
```

Retrieves a tab by its ID.

**Parameters:**

- `tabId`: The ID of the tab to retrieve

**Returns:**

- The Tab if found, undefined otherwise

## Events

The Browser class extends TypedEventEmitter and emits the following events:

- `destroy`: Emitted when the browser is destroyed

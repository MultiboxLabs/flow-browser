# Tab Overlay System

> Design document for the tab content overlay system and custom dialog overrides.

## Problem

1. **Native `alert()`, `prompt()`, and `confirm()` block the entire Electron window** and render differently on every platform, breaking the browser's custom look and feel.
2. **The renderer process has no knowledge of the active tab's pixel bounds**, making it impossible to render overlays that visually align with tab content.
3. There is no extensible mechanism for rendering UI _on top of_ tab content from within the browser chrome renderer.

## Goals

- Provide the renderer with real-time tab bounds (page bounds) so it can position overlays precisely on top of the active tab content area.
- Override `window.alert()`, `window.prompt()`, and `window.confirm()` in the preload script so web pages use custom, non-blocking dialog UI instead of native platform dialogs.
- Build a **Tab Overlay** system in the renderer that is extensible — dialogs are the first consumer, but the overlay container can host any future UI that needs to sit on top of tab content.

## Non-Goals

- Replacing Electron's `dialog.showMessageBox` or other main-process dialogs.
- Intercepting `beforeunload` dialogs (Electron handles these separately).
- Rendering overlay content _inside_ the tab's WebContentsView (the overlay lives in the browser chrome renderer, visually positioned on top).

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  Browser Chrome Renderer (flow-internal://main-ui)  │
│                                                     │
│  ┌──────────────┐   ┌────────────────────────────┐  │
│  │ TabsProvider  │   │ TabOverlayProvider         │  │
│  │ (tab state)   │   │  - pageBounds state        │  │
│  │               │   │  - dialog queue            │  │
│  └──────────────┘   │  - extensible overlay slot  │  │
│                     └────────────────────────────┘  │
│                              │                      │
│                     ┌────────▼───────────────┐      │
│                     │ <TabOverlay />          │      │
│                     │  positioned via portal  │      │
│                     │  at pageBounds coords   │      │
│                     │  ┌──────────────────┐   │      │
│                     │  │ DialogOverlay    │   │      │
│                     │  │ (alert/prompt/   │   │      │
│                     │  │  confirm)        │   │      │
│                     │  └──────────────────┘   │      │
│                     │  ┌──────────────────┐   │      │
│                     │  │ Future overlays  │   │      │
│                     │  └──────────────────┘   │      │
│                     └────────────────────────┘      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Main Process                                       │
│                                                     │
│  BrowserWindow.recomputePageBounds()                │
│   → emits page-bounds-changed                       │
│   → sends "page:on-bounds-changed" to renderer      │
│                                                     │
│  Tab webContents dialog interception                │
│   → ipcMain handles "tab-dialogs:show"              │
│   → forwards to browser chrome via                  │
│     "tab-dialogs:on-show"                           │
│   → waits for "tab-dialogs:respond"                 │
│     and resolves the dialog callback                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Tab WebContents (preload)                          │
│                                                     │
│  Overrides window.alert / prompt / confirm          │
│   → sends synchronous IPC to main process           │
│   → main process forwards to chrome renderer        │
│   → chrome renderer shows custom dialog             │
│   → result flows back via IPC                       │
└─────────────────────────────────────────────────────┘
```

---

## Design Details

### 1. Sharing Page Bounds with the Renderer

**Current state:** The main process computes `pageBounds` in `BrowserWindow.recomputePageBounds()` and emits a `"page-bounds-changed"` event internally. The renderer never receives these bounds.

**Change:** After computing new bounds, the main process sends them to the browser chrome renderer via a new IPC channel `"page:on-bounds-changed"`.

#### Main Process

In `BrowserWindow.recomputePageBounds()` (already emits the event), add a send to core webContents:

```ts
// After: this.emit("page-bounds-changed", newBounds);
this.sendMessageToCoreWebContents("page:on-bounds-changed", newBounds);
```

Also send bounds on the legacy `setPageBounds()` path:

```ts
public setPageBounds(bounds: PageBounds) {
  this.pageBounds = bounds;
  this.emit("page-bounds-changed", bounds);
  this.sendMessageToCoreWebContents("page:on-bounds-changed", bounds);
  tabsController.handlePageBoundsChanged(this.id);
}
```

A new `page:get-bounds` IPC handle returns the current bounds on demand (for initial load).

#### Preload

Add to the `FlowPageAPI` interface and preload:

```ts
getPageBounds: () => Promise<PageBounds>;
onPageBoundsChanged: IPCListener<[PageBounds]>;
```

#### Renderer

A new `usePageBounds()` hook (inside `TabOverlayProvider`) subscribes to bounds updates and provides `{ x, y, width, height }` to descendants. Components use these values for absolute positioning.

### 2. Tab Overlay Provider & Component

The overlay system is a React context + portal that renders on top of tab content.

#### `TabOverlayProvider`

- Holds `pageBounds` state (from `flow.page.onPageBoundsChanged`).
- Holds a `dialogQueue` state for pending dialog requests.
- Listens for `"tab-dialogs:on-show"` IPC events and enqueues dialog requests.
- Exposes `useTabOverlay()` hook for consumers.

#### `<TabOverlay />`

- Renders as a `position: fixed` div at exactly the `pageBounds` coordinates.
- Uses `z-index: UILayer.MODAL` (from `~/layers`) to sit above normal content.
- Only renders when there is overlay content to show (no empty overlays).
- Contains slots for dialog UI and future overlay consumers.
- The overlay div itself uses `pointer-events: none` on the container, with `pointer-events: auto` on active overlay children, so clicks pass through to the browser chrome when no overlay is active.

#### Visibility

The overlay is tied to the focused tab. When a tab is hidden (switched away), the dialog remains in the queue but the overlay is not rendered. When the tab becomes active again, the dialog reappears. This is handled by checking the `focusedTabId` against the `tabId` in the dialog request.

### 3. Dialog Override System

#### Preload (Tab WebContents)

Override `window.alert`, `window.prompt`, and `window.confirm` using `contextBridge.executeInMainWorld`. The overrides:

- Call `ipcRenderer.sendSync("tab-dialogs:show", { type, message, defaultValue? })`.
- `sendSync` blocks the page's JavaScript execution (matching native dialog behavior).
- Return the result (boolean for confirm, string|null for prompt, void for alert).

This is done in the existing preload file's tab context (not the browser chrome context). The preload already has per-origin permission checks — dialog overrides apply to **all** origins (they run in every tab's preload).

#### Main Process (Dialog Handler)

A new IPC module `src/main/ipc/browser/tab-dialogs.ts`:

```ts
ipcMain.on("tab-dialogs:show", (event, payload) => {
  // 1. Identify which tab sent this
  const tab = tabsController.getTabByWebContents(event.sender);
  if (!tab) {
    event.returnValue = null;
    return;
  }

  // 2. Find the browser window
  const window = tab.getWindow();

  // 3. Generate a unique dialog ID
  const dialogId = generateId();

  // 4. Forward to browser chrome renderer
  window.sendMessageToCoreWebContents("tab-dialogs:on-show", {
    dialogId,
    tabId: tab.id,
    type: payload.type, // "alert" | "prompt" | "confirm"
    message: payload.message,
    defaultValue: payload.defaultValue
  });

  // 5. Wait for response (one-time listener)
  ipcMain.once(`tab-dialogs:respond:${dialogId}`, (_e, result) => {
    event.returnValue = result;
  });
});
```

The `sendSync` on the tab side blocks until `event.returnValue` is set. The main process sets it when the chrome renderer responds.

#### Renderer (Dialog Components)

The `TabOverlayProvider` listens for `"tab-dialogs:on-show"` and renders the appropriate dialog component:

- `<AlertDialog />` — shows message + OK button.
- `<ConfirmDialog />` — shows message + OK/Cancel buttons.
- `<PromptDialog />` — shows message + text input + OK/Cancel buttons.

When the user interacts (clicks OK/Cancel, types input), the provider calls:

```ts
flow.tabDialogs.respond(dialogId, result);
```

Which sends `ipcRenderer.send("tab-dialogs:respond:<dialogId>", result)` to the main process, unblocking the tab's synchronous IPC call.

### 4. API Surface

#### New: `FlowTabDialogsAPI`

```ts
export interface FlowTabDialogsAPI {
  onShow: IPCListener<[TabDialogRequest]>;
  respond: (dialogId: string, result: TabDialogResult) => void;
}
```

#### New: Shared Types

```ts
// src/shared/types/tab-dialogs.ts

export type TabDialogType = "alert" | "prompt" | "confirm";

export interface TabDialogRequest {
  dialogId: string;
  tabId: number;
  type: TabDialogType;
  message: string;
  defaultValue?: string; // only for "prompt"
}

export type TabDialogResult =
  | { type: "alert" } // alert: no return value
  | { type: "confirm"; confirmed: boolean } // confirm: true/false
  | { type: "prompt"; value: string | null }; // prompt: string or null (cancel)
```

#### Updated: `FlowPageAPI`

```ts
export interface FlowPageAPI {
  // ... existing methods ...
  getPageBounds: () => Promise<PageBounds>;
  onPageBoundsChanged: IPCListener<[PageBounds]>;
}
```

### 5. Overlay Extensibility

The `<TabOverlay />` component is designed as a container with named slots:

```tsx
function TabOverlay() {
  const { pageBounds } = usePageBounds();
  const { dialogQueue } = useTabDialogs();

  if (!pageBounds) return null;

  const hasContent = dialogQueue.length > 0; // || futureOverlayActive

  if (!hasContent) return null;

  return createPortal(
    <div
      className="fixed pointer-events-none"
      style={{
        left: pageBounds.x,
        top: pageBounds.y,
        width: pageBounds.width,
        height: pageBounds.height
      }}
    >
      {/* Dialog layer */}
      {dialogQueue.length > 0 && <DialogOverlay request={dialogQueue[0]} />}

      {/* Future: permission prompts, file pickers, etc. */}
    </div>,
    document.body
  );
}
```

Future overlays can be added by:

1. Adding state to `TabOverlayProvider`.
2. Adding a new IPC listener for the overlay type.
3. Adding a new child component inside `<TabOverlay />`.

### 6. Dialog UI Design

The dialog components should:

- Be centered within the tab bounds area.
- Have a semi-transparent scrim backdrop (within the tab bounds only).
- Show the **origin** (hostname) of the page that triggered the dialog for security.
- Include a checkbox "Prevent this page from creating additional dialogs" (matching Chrome's behavior). This is tracked per-tab and, when enabled, auto-dismisses further dialogs from the same tab.
- Use the existing design system (TailwindCSS, existing color tokens).
- Animate entry/exit using `motion/react`.

### 7. File Structure

```
src/
├── shared/
│   └── types/
│       └── tab-dialogs.ts              # TabDialogRequest, TabDialogResult types
│   └── flow/
│       └── interfaces/
│           └── browser/
│               └── tab-dialogs.ts      # FlowTabDialogsAPI interface
│               └── page.ts             # Updated with getPageBounds, onPageBoundsChanged
├── main/
│   └── ipc/
│       └── browser/
│           └── tab-dialogs.ts          # Dialog IPC handler (main process)
│           └── page.ts                 # Updated with page:get-bounds handler
│   └── controllers/
│       └── windows-controller/
│           └── types/
│               └── browser.ts          # Updated to send bounds to renderer
├── preload/
│   └── index.ts                        # Updated: dialog overrides + tab-dialogs API
├── renderer/
│   └── src/
│       └── components/
│           └── tab-overlay/
│               ├── provider.tsx        # TabOverlayProvider (bounds + dialog state)
│               ├── tab-overlay.tsx     # TabOverlay portal component
│               └── dialogs/
│                   ├── dialog-overlay.tsx   # Dialog container with scrim
│                   ├── alert-dialog.tsx     # Alert UI
│                   ├── confirm-dialog.tsx   # Confirm UI
│                   └── prompt-dialog.tsx    # Prompt UI
```

---

## Data Flow

### Dialog Lifecycle

```
Web Page calls alert("Hello")
  │
  ▼
Preload: window.alert override
  │  ipcRenderer.sendSync("tab-dialogs:show", { type: "alert", message: "Hello" })
  │  (blocks tab JS execution)
  ▼
Main Process: ipcMain.on("tab-dialogs:show")
  │  1. Identify tab + window
  │  2. Generate dialogId
  │  3. Forward to chrome: "tab-dialogs:on-show"
  │  4. Register one-time listener for response
  ▼
Chrome Renderer: TabOverlayProvider
  │  1. Receives dialog request via IPC
  │  2. Adds to dialogQueue
  │  3. TabOverlay renders DialogOverlay
  ▼
User clicks "OK"
  │
  ▼
Chrome Renderer: respond(dialogId, { type: "alert" })
  │  ipcRenderer.send("tab-dialogs:respond:<dialogId>", result)
  ▼
Main Process: ipcMain.once("tab-dialogs:respond:<dialogId>")
  │  Sets event.returnValue = result
  ▼
Preload: sendSync returns result
  │
  ▼
Web Page: alert() returns (unblocks)
```

### Page Bounds Updates

```
Window resize / Sidebar toggle / Topbar change
  │
  ▼
BrowserWindow.recomputePageBounds()
  │  1. Computes { x, y, width, height }
  │  2. Emits "page-bounds-changed"
  │  3. Sends "page:on-bounds-changed" to chrome renderer
  ▼
Chrome Renderer: TabOverlayProvider
  │  Updates pageBounds state
  ▼
TabOverlay: re-renders at new position
```

---

### 8. Tab Visibility During Dialogs

The browser chrome renderer sits behind tab WebContentsViews in the Electron
view stack (`ViewLayer.TAB > base level`). To make the dialog overlay visible,
the main process **hides the active tab's WebContentsView** (`tab.view.setVisible(false)`)
when a dialog request arrives. The background gradient and the dialog overlay
in the chrome renderer become visible where the tab was. When the dialog is
dismissed (user clicks OK/Cancel), the tab view is restored
(`tab.view.setVisible(true)`) before returning the synchronous result.

## Edge Cases

1. **Tab switched while dialog is open:** The dialog stays in the queue. The overlay hides (because `focusedTabId !== dialog.tabId`). When the tab becomes active again, the dialog reappears.

2. **Tab closed while dialog is open:** The main process detects the tab is destroyed. It auto-responds to any pending dialogs for that tab (alert → void, confirm → false, prompt → null) and removes them from the queue.

3. **Multiple dialogs from the same tab:** Dialogs are queued. Only the first is shown. When it's dismissed, the next one appears. This matches Chrome's behavior.

4. **"Prevent additional dialogs" checkbox:** When checked, a per-tab flag is set. Subsequent dialog requests from the same tab are auto-responded (alert → void, confirm → false, prompt → null) without showing UI.

5. **Page navigation while dialog is open:** The tab navigates away, which implicitly cancels pending synchronous calls. The main process should handle this by auto-responding to pending dialogs if the tab's webContents navigates.

6. **Fullscreen tab:** Page bounds cover the entire window content area (matching `TabLayoutManager`'s fullscreen logic). The overlay positions correctly because it uses the same `pageBounds`.

---

## Implementation Order

1. **Page bounds sharing** — IPC channel + renderer hook.
2. **Tab overlay provider + component** — React context + portal.
3. **Main process dialog handler** — IPC for dialog forwarding.
4. **Preload dialog overrides** — Override alert/confirm/prompt.
5. **Dialog UI components** — Alert, Confirm, Prompt.
6. **Edge case handling** — Tab close, navigation, suppress checkbox.

# Tab-Scoped JavaScript Dialog Overlay

## Status

Accepted. This document is the source of truth for the implementation in this
branch.

## Problem

JavaScript dialogs triggered by page content (`alert`, `confirm`, `prompt`)
currently use Chromium/Electron's platform-native handling:

- The UI looks different on each operating system.
- The dialog blocks the entire browser window instead of only the tab that
  triggered it.
- The browser UI renderer does not currently know the tab's exact bounds, so it
  cannot place a custom overlay precisely on top of the tab view.

## Goals

- Show page dialogs inside a Flow-styled overlay that is scoped to the tab's
  exact bounds.
- Keep browser chrome interactive while the tab dialog is open.
- Hide the overlay automatically when the owning tab is hidden and show it again
  if the tab becomes visible later.
- Give the renderer an exact, main-owned `tab.bounds` value that other features
  can reuse in the future.
- Make the overlay system extensible so future tab-scoped UI can reuse the same
  bounds-driven portal infrastructure.

## Non-goals

- Rebuilding Chromium's full JavaScript dialog UX, including `beforeunload`.
- Replacing native dialogs used by Flow's own browser chrome.
- Making arbitrary web pages depend on Flow-specific globals.

## Key decision

### The renderer learns tab bounds from main-owned tab geometry

The main process already computes and applies the final tab bounds. That must
remain the source of truth. We will expose those exact bounds to the renderer as
runtime tab metadata instead of re-measuring the DOM or duplicating spring
animation logic in the renderer.

### We override `window.alert` / `window.confirm` / `window.prompt` from preload

These APIs are synchronous, so a simple async bridge is not acceptable for
arbitrary websites. The final design uses a synchronous preload bridge:

- preload patches the page's main world before page scripts run
- the patched methods delegate into the isolated preload world
- preload performs a **synchronous XHR** to a dedicated secure custom protocol
  (`flow-dialog://`)
- main keeps that protocol request open until the browser UI responds

This keeps page semantics synchronous while avoiding Chromium/Electron's native
JavaScript dialog UI.

## Architecture

### 1. Main process: exact tab geometry

Each tab already has a `TabBoundsController` that owns the last applied integer
`WebContentsView` bounds. We will expose that geometry to the renderer:

- `TabData.visible` is added as runtime state.
- `TabData.bounds` is added as runtime state.
- A new lightweight `tabs:on-tab-geometry-updated` push channel streams
  `tabId`, `visible`, and `bounds` updates to the browser UI renderer.

This makes the main process the only place that computes tab geometry, including
glance-mode sizing and spring-animated transitions.

### 2. Renderer: bounds-driven portal primitive

Today `PortalComponent` positions overlay views by measuring a DOM anchor with
`useBoundingRect()`. That is correct for popovers and floating chrome, but it is
not the right primitive for tab overlays because the tab itself lives in a main-
process `WebContentsView`.

We will introduce a reusable bounds-driven portal primitive:

- `PortalBoundsComponent`
  - accepts `{ x, y, width, height }` directly
  - reuses the existing pooled portal window infrastructure
  - does not depend on DOM measurement

Then we build a higher-level browser UI primitive:

- `TabOverlayPortal`
  - looks up a tab by `tabId`
  - reads `tab.bounds` + `tab.visible`
  - shows a portal only while the tab is visible

Future tab-scoped overlays should use `TabOverlayPortal` rather than inventing
their own bounds logic.

### 3. Preload + main: synchronous dialog bridge

Each page/frame preload creates a dialog client ID and uses it to make
synchronous requests to `flow-dialog://`.

Main process responsibilities:

- map incoming dialog client IDs back to the owning tab/webContents
- create `TabDialogState`
- broadcast dialog state to the owning browser window
- resolve the held protocol request once browser UI answers

This path supports `alert`, `confirm`, and `prompt` without depending on
Electron's native page dialog implementation.

### 4. Renderer: dialog overlay feature

The browser UI gets a new tab overlay feature module:

- `TabOverlays`
  - root entry point for tab-scoped overlays
  - currently renders JavaScript dialogs
  - future features can be added alongside it

- `JavaScriptDialogsOverlay`
  - subscribes to `flow.tabDialogs`
  - renders one overlay per pending dialog
  - uses `TabOverlayPortal`
  - supports `alert`, `confirm`, and `prompt`

This keeps dialog-specific UI separate from the generic tab-overlay plumbing.

## Data model

### Runtime tab geometry

`TabData` gains:

- `visible: boolean`
- `bounds: PageBounds | null`

`bounds` is the last main-applied integer rectangle for the tab view.

### Dialog state

New shared types:

- `TabDialogType = "alert" | "confirm" | "prompt"`
- `TabDialogState`
  - `id`
  - `tabId`
  - `type`
  - `messageText`
  - `defaultPromptText`

New browser API for Flow's browser UI:

- `flow.tabDialogs.getState()`
- `flow.tabDialogs.onStateChanged()`
- `flow.tabDialogs.respond(dialogId, { accept, promptText? })`

## Event flow

### Opening a dialog

1. Page script calls `alert`, `confirm`, or `prompt`.
2. The preload override issues a synchronous request to `flow-dialog://`.
3. Main maps the request to the owning tab via the dialog client ID.
4. Main maps the request to the owning `Tab`.
5. Main stores `TabDialogState` and notifies the owning browser UI renderer.
6. Renderer renders `JavaScriptDialogsOverlay` in a `TabOverlayPortal`.
7. The overlay portal uses the tab's exact main-owned `bounds`.

### Responding to a dialog

1. User presses OK / Cancel or submits prompt text.
2. Renderer calls `flow.tabDialogs.respond(...)`.
3. Main resolves the waiting `flow-dialog://` request.
4. The synchronous XHR returns to preload with the final result.
5. Main clears the pending dialog and broadcasts the new state.
6. The override returns the correct synchronous result to page code.

### Hidden tab behavior

- The pending dialog remains associated with the tab in main.
- The renderer hides the overlay automatically when `tab.visible === false`.
- If the tab becomes visible again, the same pending dialog is rendered again.

This matches the requirement that the overlay should "go with" the tab.

## Implementation plan

### Shared / types

- Extend runtime tab types with `visible` and `bounds`.
- Add shared dialog state/response types.
- Add a new `FlowTabDialogsAPI` interface.

### Main

- Add a lightweight tab geometry update channel to the tabs IPC module.
- Expose current bounds from `TabBoundsController`.
- Emit geometry updates whenever applied bounds or visibility changes.
- Add a dedicated `flow-dialog` protocol and register it in each session.
- Add a `tab-dialogs-controller` that:
  - registers dialog client IDs from preload
  - maps them to live tabs/webContents
  - tracks pending dialogs
  - resolves pending protocol requests
  - cleans up on webContents destruction
- Add IPC handlers for `tab-dialogs:get-state`, `tab-dialogs:respond`, and
  synchronous client registration.

### Renderer

- Add `flow.tabDialogs` to the preload-exposed Flow API.
- Patch page-world `alert` / `confirm` / `prompt` from preload before page
  scripts run.
- Use synchronous XHR to `flow-dialog://` from the isolated preload world.
- Teach `TabsProvider` to merge tab geometry updates into `tabsData`.
- Add `PortalBoundsComponent`.
- Add `TabOverlayPortal`.
- Add `TabOverlays` and `JavaScriptDialogsOverlay`.
- Mount `TabOverlays` near the existing `FindInPage` overlay entry point.

## UI behavior

- The overlay fills only the tab rectangle.
- A translucent scrim blocks interaction with the page, not the browser chrome.
- Dialog card is centered in the tab.
- `alert`: message + `OK`
- `confirm`: message + `Cancel` / `OK`
- `prompt`: message + input + `Cancel` / `OK`
- `Escape` dismisses `confirm` / `prompt`, but not `alert`.
- `Enter` submits `prompt` and confirms focused default actions.

## Maintainability rules

- Generic portal plumbing lives under `components/portal`.
- Generic tab-bound overlay plumbing lives under
  `components/browser-ui/tab-overlays`.
- Dialog-specific state and presentation live in a dedicated
  `javascript-dialogs` module.
- Future tab overlays must build on `TabOverlayPortal` rather than re-measuring
  tab DOM bounds.

## Rejected alternatives

### Recompute tab bounds in the renderer

Rejected because the main process already owns final tab geometry, including
group-mode transforms and spring interpolation. Duplicating that logic would
create another source of truth.

### Use `useBoundingRect()` on a renderer anchor

Rejected because the tab view is not a renderer DOM node. Measuring a nearby DOM
placeholder can drift from the actual `WebContentsView`, especially as layout
logic evolves.

### Delayed CDP interception of JavaScript dialogs

Rejected because it can observe native dialogs, but it cannot replace the
user-facing native UI with a Flow overlay while still waiting for a human
response.

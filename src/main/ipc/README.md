# IPC Namespaces

This directory contains all `ipcMain` registrations that the Flow browser exposes to renderer processes. Each module keeps the handlers for a single area of the app (e.g. sessions, windows, browser state) and is imported by `src/main/ipc/main.ts`. Importing a module is enough to register its listeners.

> **Renderer opt-in:** Renderers that expect push-style updates must emit `listeners:add`/`listeners:remove` (see below) so the main process can deliver broadcasts only to windows that are listening.

## Bootstrapping

- `main.ts` &mdash; central entry point that imports every namespace. Add new IPC files here to ensure handlers run.

## Listener management

- `listeners-manager.ts`
  - Tracks which `WebContents` listens to which channel via the `listeners:add` / `listeners:remove` events. Renderer messages should pass a unique listener id so they can unsubscribe cleanly.
  - Exposes helpers:
    - `sendMessageToListeners(channel, ...args)` &mdash; broadcast to every subscribed renderer.
    - `sendMessageToListenersWithWebContents(webContents[], channel, ...args)` &mdash; scoped broadcast.

## Adding a new namespace

1. Create a new file (or folder) under `src/main/ipc/` and register handlers with `ipcMain.on` / `ipcMain.handle`.
2. Add any broadcast helpers that other main-process modules can call instead of importing `ipcMain` directly.
3. If renderers should receive push updates, leverage `listeners-manager` and document the channel name. Remember to clean up listeners when renderer views unmount.
4. Import the new module from `src/main/ipc/main.ts`.

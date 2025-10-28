## Architectural overview

All modules inside this directory export singletons whose side effects register listeners, timers, and IPC bridges as soon as they are imported. The shared `index.ts` does not re-export anything; it simply defines the bootstrap order so downstream imports can rely on eagerly constructed dependencies.

Two tiers of modules exist:
- **Runtime coordinators** operate in-process, cache state, and emit typed events when mutations occur. They are designed to be consumed by the rest of the main process without exposing implementation details.
- **Raw data adapters** (files named `raw.ts`) interact with disk, settings stores, and other side effects. Coordinators wrap these adapters to provide caching, validation, and eventing.

The overall design favours an event-driven model: each coordinator extends the typed event emitter found in `@/modules/typed-event-emitter`. External consumers subscribe to lifecycle signals—profile creation, space reordering, tab activation, window focus changes, update status shifts—rather than polling shared state. This keeps UI layers and background services synchronized while maintaining strict ownership boundaries.

## Key subsystems

### Application lifecycle and initialization
- Bootstrap imports register menu creation, window tracking, profile setup, and quit guards in a deterministic order.
- Controllers that rely on Electron readiness defer work until `app.whenReady()` resolves, while others react immediately to cached data becoming available.
- Cross-cutting utilities (settings cache, telemetry identifiers, shortcut emitters, etc.) raise events that trigger re-rendering or configuration refresh.

### Profile and workspace management
- Profile metadata is persisted in per-profile datastores, with caches primed on first access. Creation validates identifiers, provisions user data directories, and can optionally seed default workspaces.
- Workspace records (sometimes called “spaces”) are scoped to profiles, maintain ordering plus “last used” timestamps, and surface helper APIs for bulk reordering or recent lookups.
- Runtime modules subscribe to these events to update menus, window state, and tab assignment.

### Session loading and extensions
- Chromium sessions are loaded on demand, with concurrent loads deduplicated. Each session normalizes user agents, initializes extension environments, and registers callbacks so extension-driven tab/window creation flows back through the same controller APIs as first-party actions.
- Loaded sessions are tracked for cleanup on quit, including flushing cookies and storage to mitigate data loss.

### Tabs and window orchestration
- Window managers wrap Electron `BrowserWindow` subclasses to provide typed access, singleton enforcement where required, and utility helpers such as `getFocused()` or `getFromWebContents()`.
- Browser windows host an omnibox overlay, manage layered `WebContentsView` instances through a view manager, and propagate layout changes (page bounds updates) back to the tab system.
- Tab objects encapsulate web contents, persistence hooks, context menu wiring, and animated bounds management. The tab coordinator tracks active state per window-space pair, maintains focus history, supports tab grouping modes, and periodically applies “sleep” or “archive” policies to long-idle background tabs.
- Keyboard handling integrations (for example intercepting `Ctrl+W` on Windows) route through the same orchestrator to ensure app-wide consistency.

### Platform services
- Networking and telemetry modules initialize analytics clients, enrich events with app metadata, and, when packaged, auto-capture unhandled exceptions.
- Update management wraps `electron-updater`, honouring platform support, user settings, and optionally mock data for manual testing. Status changes are emitted so renderer components can reflect availability, download progress, and installation prompts.
- Default protocol registration exposes high-level helpers that branch per operating system to set Flow as the default browser when requested.

### Shutdown flow
- Quit guards listen to `before-quit`, defer the native quit sequence, and run asynchronous cleanup (session flushes, cookie writes, etc.). Only after all tasks resolve truthy does the app re-trigger the quit call to let Electron exit normally.

## Working with controllers
- Import controllers once per process. The module side effects instantiate global singletons and repeated imports return the already-initialized instance.
- Subscribe to emitted events wherever possible instead of reading internal maps directly; this keeps consumers decoupled from cache implementation details.
- When introducing a new domain, mirror the pattern of a lightweight `raw.ts` adapter plus a caching coordinator that raises typed events.
- Maintain import ordering through `index.ts` if new modules depend on existing ones being hydrated first.

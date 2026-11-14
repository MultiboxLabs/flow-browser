# Tabs Service v2

## Architecture

### Singleton Services

- **TabService** - Central orchestrator managing all tabs, layouts, and pinned tabs.
- **TabPersistenceService** - Saves/restores tab state to the database with dirty-tracking and batch flushing.
- **TabIPC** - Handles all renderer communication with debounced structural/content updates.

### Core Entities

- **Tab** - A single browser tab. Owns identity, state, WebContentsView, and event emission. The view is nullable (sleeping tabs have no view to save RAM).
- **TabLayoutNode** - Contains tabs displayed together. Modes: `single`, `glance`, `split`. In the old system this was called "TabGroup".
- **PinnedTab** - A persistent URL shortcut linked to a profile. Core component with per-space associations.

### Layout Management

- **TabLayout** - One per window. Holds all TabLayoutNodes for that window. Tracks active node, focused tab, and activation history per space.
- **TabPositioner** - Manages tab ordering. Uses floating-point positions for efficient insertion.

## Key Design Decisions

### Tab Ownership (TabOwnerRef)

Every tab has an `owner` field:

- `{ kind: "normal" }` — Standard tab, persisted independently.
- `{ kind: "pinned", pinnedTabId: string }` — Owned by a PinnedTab. Ephemeral (not persisted independently).
- `{ kind: "bookmark", bookmarkId: string }` — (Future) Owned by a Bookmark. Ephemeral.

This replaces the old `ephemeral` boolean with a typed, extensible ownership model.

### Pinned Tabs as Core

Pinned tabs are first-class citizens, not bolted on. They live inside the TabService and own their associated tabs via the ownership system.

### Layout Nodes vs Tab Groups

The old "TabGroup" (glance/split modes) is now "TabLayoutNode" — it represents visual display grouping.
The name "TabGroup" is reserved for future folder-like tab organization (Chrome-style color-coded groups).

### IPC Channels

All channels prefixed with `tab-service:` for clean namespacing:

- `tab-service:get-data` → `WindowTabsPayload`
- `tab-service:on-data-changed` → structural changes
- `tab-service:on-content-updated` → lightweight content-only updates
- `tab-service:pinned-tabs-changed` → pinned tab state changes

### Persistence

- Only `normal`-owned tabs are persisted (ephemeral tabs are transient).
- Dirty tracking with batch flush every 2s.
- Immediate persistence for pinned tabs (infrequent changes).

## QnA

Q: How are ephemeral tabs handled?
A: Tabs have an `owner` property. When `owner.kind !== "normal"`, the tab is ephemeral and not persisted independently.

Q: How are tabs saved to the database?
A: TabPersistenceService serializes normal-owned tabs and flushes them periodically.

Q: How are tabs objects for pinned tabs handled?
A: They are created with `owner: { kind: "pinned", pinnedTabId }` and associated to the PinnedTab entity.

Q: How will bookmarks work in the future?
A: Same as pinned tabs — create a tab with `owner: { kind: "bookmark", bookmarkId }`. The Bookmark entity will follow the PinnedTab pattern.

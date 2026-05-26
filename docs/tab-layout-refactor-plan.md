# TabLayout Refactor Plan

## Current Architecture

```
Window A
└── TabLayout (1 per window)
    ├── activeNodeMap: Map<WindowSpaceKey, TabLayoutNode>
    ├── focusedTabMap: Map<WindowSpaceKey, Tab>
    ├── activationHistory: Map<WindowSpaceKey, string[]>
    └── layoutNodes: Map<nodeId, TabLayoutNode>  ← ALL nodes in the window
```

**Problems:**

1. `TabLayout` mixes concerns for multiple spaces using `WindowSpaceKey` composite keys
2. Bounds calculation lives in `TabService.handlePageBoundsChanged` — iterates all tabs in window, checks visibility, then asks the active node for sub-bounds
3. Space switching hides/shows tabs by iterating `getTabsInWindowSpace` — not layout-aware
4. In STAW mode, tabs physically move between windows (expensive screenshot + `setWindow` cycle)
5. Pinned tab nodes only exist in the window where they were created

---

## Proposed Architecture

```
Window A
├── TabLayout (Space A)  ← visible=true (window's current space)
│   ├── activeNode: TabLayoutNode
│   ├── focusedTab: Tab
│   ├── activationHistory: string[]
│   └── nodes: Set<TabLayoutNode>  (all nodes in this layout)
│
├── TabLayout (Space B)  ← visible=false
│   ├── activeNode: TabLayoutNode
│   ├── ...
│   └── nodes: Set<TabLayoutNode>
│
└── TabLayout (Space C)  ← visible=false
    └── ...
```

### Key: `TabLayoutNode` can appear in multiple `TabLayout`s

```
TabLayoutNode "ln-123" (for a STAW tab)
├── activeLayout: TabLayout (Space A, Window A)  ← real content shown here
├── memberLayouts: Set<TabLayout>  ← {Window A/Space A, Window B/Space A}
└── In Window B/Space A: shows placeholder thumbnail
```

---

## Data Model Changes

### `TabLayout` (one per window-space)

```typescript
class TabLayout extends TypedEventEmitter<TabLayoutEvents> {
  readonly windowId: number;
  readonly spaceId: string;
  visible: boolean;  // toggled on space switch

  // Per-layout state (no more composite keys)
  private activeNode: TabLayoutNode | null;
  private focusedTab: Tab | null;
  private activationHistory: string[];

  // Nodes belonging to this layout
  private nodes: Map<string, TabLayoutNode>;

  // Main bounds (computed from window.pageBounds)
  private mainBounds: Electron.Rectangle;

  // Methods
  computeMainBounds(): Electron.Rectangle;  // reads from window.pageBounds
  setVisible(visible: boolean): void;
  getActiveNode(): TabLayoutNode | null;
  setActiveNode(node: TabLayoutNode): void;
  ...
}
```

### `TabLayoutNode` changes

```typescript
class TabLayoutNode extends TypedEventEmitter<TabLayoutNodeEvents> {
  // Existing fields...

  // NEW: Which layouts this node belongs to
  private _memberLayouts: Set<TabLayout> = new Set();

  // NEW: Which layout is "active" for this node (shows real content)
  // Other member layouts show a placeholder thumbnail
  private _activeLayout: TabLayout | null = null;

  // Methods
  addToLayout(layout: TabLayout): void;
  removeFromLayout(layout: TabLayout): void;
  setActiveLayout(layout: TabLayout): void;
  get activeLayout(): TabLayout | null;
  get memberLayouts(): ReadonlySet<TabLayout>;

  // Secondary bounds calculation
  // Takes main bounds from the layout and returns actual bounds for each tab
  computeBounds(mainBounds: Electron.Rectangle): Map<Tab, Electron.Rectangle>;
}
```

### `TabService.layouts` changes

```typescript
// OLD: Map<windowId, TabLayout>
// NEW: Map<layoutKey, TabLayout>  where layoutKey = `${windowId}-${spaceId}`

// Helper to get all layouts for a window
getLayoutsForWindow(windowId: number): TabLayout[];

// Helper to get the visible layout for a window
getVisibleLayout(windowId: number): TabLayout | null;

// Helper to get layout for a specific window-space
getLayout(windowId: number, spaceId: string): TabLayout | undefined;

// Create layout when space first has tabs in a window
getOrCreateLayout(windowId: number, spaceId: string): TabLayout;
```

---

## Bounds Calculation Split

### Current (in `TabService.handlePageBoundsChanged`):

```
1. Get pageBounds from window
2. For each visible tab in window:
   - If fullscreen → use full content size
   - Else if in multi-tab node → computeNodeTabBounds()
   - Else → use pageBounds directly
3. tab.view.setBounds(bounds)
```

### New:

**TabLayout.computeMainBounds():**

```
1. Get pageBounds from window
2. If active node's front tab is fullscreen → full content size
3. Otherwise → pageBounds (or could factor in sidebar, other chrome)
4. Return mainBounds
```

**TabLayoutNode.computeBounds(mainBounds):**

```
For "single" mode:
  → Return { tab: mainBounds } (passthrough)

For "split" mode:
  → Divide mainBounds horizontally by tab count

For "glance" mode:
  → Front tab: 85% centered, Back tab: 95% centered
```

**TabLayout.applyBounds():**

```
1. mainBounds = this.computeMainBounds()
2. If activeNode:
   boundsMap = activeNode.computeBounds(mainBounds)
   for each [tab, bounds] in boundsMap:
     tab.view.setBounds(bounds)
     tab.view.setBorderRadius(...)
```

---

## Space Switching

### Current flow (`setCurrentWindowSpace`):

1. Hide tabs in old space (iterate `getTabsInWindowSpace`)
2. Maybe activate a tab in new space
3. `updateTabVisibility` + `handlePageBoundsChanged`

### New flow:

1. `oldLayout.setVisible(false)` — hides all tabs in old layout
2. `newLayout.setVisible(true)` — shows tabs in new layout
3. `newLayout.applyBounds()` — position tabs correctly

This is cleaner because:

- Each `TabLayout` knows exactly which tabs it owns
- Visibility is a layout-level concept, not per-tab iteration
- Bounds calculation is self-contained

---

## STAW Mode (Sync Tabs Across Windows)

### Current:

- When Window B focuses, the tab's view is physically moved from Window A → Window B
- A screenshot placeholder is left in Window A
- `moveTabToWindowIfNeeded` → `setWindow` → `migrateTabBetweenLayouts`

### New:

- The `TabLayoutNode` exists in BOTH `TabLayout`s (Window A/Space X AND Window B/Space X)
- The node's `_activeLayout` tracks which layout shows real content
- When Window B focuses: `node.setActiveLayout(layoutB)` — no physical move needed
- Non-active layouts show the placeholder thumbnail automatically
- The Tab's `view` is attached to the `_activeLayout`'s window

**Benefits:**

- No expensive screenshot + move cycle on every window focus
- Node state (position, activation history) is preserved in both layouts
- Switching back is instant (just change `_activeLayout`)

**Migration of physical view:**
When `activeLayout` changes, the Tab's view needs to be reparented to the new window.
This is still needed but happens via `TabLayoutNode.setActiveLayout()`:

```typescript
setActiveLayout(layout: TabLayout): void {
  if (this._activeLayout === layout) return;
  const oldLayout = this._activeLayout;
  this._activeLayout = layout;

  // Move the view to the new window
  for (const tab of this._tabs) {
    if (tab.view && layout.windowId !== tab.getWindow().id) {
      tab.setWindow(browserWindowsController.getWindowById(layout.windowId));
    }
  }

  // Show placeholder in old layout
  oldLayout?.showPlaceholderForNode(this);
  // Show real content in new layout
  layout.showContentForNode(this);

  this.emit("active-layout-changed", layout, oldLayout);
}
```

---

## Pinned Tab Nodes

### Current:

- Pinned tab has one live `Tab` at a time
- Tab moves between spaces (via `clickPinnedTab`)
- Node only exists in one layout

### New:

- When a pinned tab is activated in a space, its `TabLayoutNode` is registered in ALL `TabLayout`s for that profile's spaces in that window
- This way, switching spaces doesn't need special pinned-tab logic — the node is already there
- The node's `activeLayout` determines where the real view shows
- Other layouts show a placeholder (pinned tab icon/thumbnail)

**Implementation:**

```typescript
// When a pinned tab's node is created:
registerPinnedTabNode(node: TabLayoutNode, profileId: string): void {
  // Add to all layouts whose space belongs to this profile
  for (const [key, layout] of this.layouts) {
    const space = spacesController.getFromCache(layout.spaceId);
    if (space?.profileId === profileId) {
      node.addToLayout(layout);
    }
  }
}
```

When a new space is created for that profile, it auto-adds existing pinned tab nodes.

---

## Tab Visibility

### Current:

`updateTabVisibility(windowId, spaceId)` iterates all tabs in window+space, shows only active node's tabs.

### New:

Each `TabLayout` manages its own visibility:

```typescript
class TabLayout {
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (visible) {
      // Show active node's tabs
      if (this.activeNode) {
        // Only show if this is the node's active layout
        if (this.activeNode.activeLayout === this) {
          for (const tab of this.activeNode.tabs) {
            tab.visible = true;
            tab.layer?.setVisible(true);
          }
        } else {
          // Show placeholder
          this.showPlaceholderForNode(this.activeNode);
        }
      }
    } else {
      // Hide all tabs managed by this layout
      for (const node of this.nodes.values()) {
        if (node.activeLayout === this) {
          for (const tab of node.tabs) {
            tab.visible = false;
            tab.layer?.setVisible(false);
          }
        }
      }
    }
  }
}
```

---

## Migration Path

### Phase 1: Change `TabLayout` to per-window-space

1. Remove `WindowSpaceKey` composite — each layout has a single `spaceId`
2. Change `TabService.layouts` from `Map<windowId, TabLayout>` to `Map<string, TabLayout>` (keyed by `${windowId}-${spaceId}`)
3. Add `getLayoutsForWindow(windowId)` helper
4. Update all 23 callsites in `tab-service.ts` that access `this.layouts.get(windowId)`
5. Update 2 callsites in `tab-sync.ts` and 2 in `tab-ipc.ts`

### Phase 2: Move bounds calculation into TabLayout/TabLayoutNode

1. Add `computeMainBounds()` to `TabLayout`
2. Add `computeBounds(mainBounds)` to `TabLayoutNode`
3. Add `applyBounds()` to `TabLayout`
4. Remove `handlePageBoundsChanged` from `TabService` — call `layout.applyBounds()` instead

### Phase 3: Implement STAW via multi-layout membership

1. Add `_memberLayouts` and `_activeLayout` to `TabLayoutNode`
2. Update `registerNode` / node creation to register in relevant layouts
3. Replace physical tab-move-between-windows with `setActiveLayout`
4. Update placeholder logic to be layout-aware (not window-level `Map`)

### Phase 4: Pinned tab nodes in all profile layouts

1. When pinned tab node is created, register it in all layouts for that profile
2. Listen for new layouts (spaces) being created to auto-add pinned nodes
3. Remove the per-click space-move logic — node already exists everywhere

### Phase 5: Visibility & space switching

1. Implement `TabLayout.setVisible()`
2. Simplify `setCurrentWindowSpace` to just toggle layout visibility
3. Remove `updateTabVisibility` method (replaced by layout-level visibility)

---

## Files to Modify

| File                      | Changes                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `layout/tab-layout.ts`    | Major rewrite: per-space, visibility, bounds, no composite keys                                         |
| `core/tab-layout-node.ts` | Add `_memberLayouts`, `_activeLayout`, `computeBounds()`                                                |
| `tab-service.ts`          | Change `layouts` map, update all 23 callsites, remove `handlePageBoundsChanged` / `updateTabVisibility` |
| `tab-sync.ts`             | Replace physical moves with `setActiveLayout`, simplify placeholders                                    |
| `ipc/tab-ipc.ts`          | Update layout queries                                                                                   |
| `persistence/`            | Layout persistence now keyed by window+space                                                            |
| `saving/tabs/restore.ts`  | Create layouts per space during restore                                                                 |

---

## Risks / Open Questions

1. **Performance of multi-layout membership**: If a user has 20 spaces, does a pinned tab node being in 20 layouts cause overhead? → Likely fine, Sets are O(1) for add/remove/has.

2. **View reparenting**: Even with the new model, moving a tab's `WebContentsView` to a different window's `contentView` is still needed. The benefit is that we can defer it (show placeholder immediately, move view async).

3. **Activation history per layout**: Each layout has its own history — is this correct? When you switch spaces, should the history from the old space persist? → Yes, each layout's history is independent.

4. **PiP transitions**: Currently triggered in `updateTabVisibility`. In the new model, they'd trigger in `TabLayout.setVisible(false)`. Need to preserve auto-PiP behavior.

5. **IPC payload**: The renderer currently receives ALL tabs for the window. With per-space layouts, should we only send the current layout's tabs? → Probably still send all (sidebar shows all spaces' tabs). But layout nodes now come from the current layout only.

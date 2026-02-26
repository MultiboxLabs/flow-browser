# Layering System Design

## Problem Statement

Flow's UI composites multiple rendering surfaces: the base BrowserWindow
webContents (browser chrome), child WebContentsViews (tabs, portals, omnibox),
and CSS-stacked elements within each renderer. The current system manages these
with scattered magic numbers, duplicated constants, and two completely decoupled
z-index scales that share no common model.

Specific pain points:

- **No single source of truth.** Electron-level z-index constants live in
  `tab-layout.ts`, `portal-component-windows.ts`, `popover.tsx`, and
  `browser.ts`. CSS z-index values are raw Tailwind classes across 40+ files.
- **Collisions.** Glance front tabs and portal component windows both occupy
  z-index 3 at the Electron level. Their visual ordering depends on insertion
  order, which is fragile and implicit.
- **Magic numbers.** The omnibox uses 999, portals use 3, popovers use 4.
  These values have no semantic meaning and the gaps between them are arbitrary.
- **Overloaded CSS layers.** Eight different component types all use `z-50`:
  dialogs, sheets, tooltips, popovers, dropdown menus, select menus, the
  sidebar hover detector, and settings editors. There is no way to
  intentionally layer one above another.
- **No enforceability.** Nothing prevents a developer from adding `z-[9999]`
  to solve a visual bug, silently breaking the hierarchy.

---

## Core Concept: Stacking Context Isolation

Before defining the layers, it is critical to understand how the two tiers
relate to each other.

**Each WebContentsView is a completely isolated stacking context.** CSS
`z-index` inside the main browser chrome renderer has zero effect on the
Electron-level view ordering, and vice versa. A `z-index: 99999` in the base
renderer will never make an element appear above a WebContentsView child like
a tab or portal. Conversely, a portal at `ViewLayer.OVERLAY` cannot use CSS to
push itself above the omnibox at `ViewLayer.OMNIBOX`.

This means:

1. **ViewLayer** controls which WebContentsView is on top of which. It is the
   only mechanism for cross-view stacking.
2. **UILayer** controls stacking within a single renderer. It applies
   independently and identically inside every renderer — the main chrome, the
   omnibox, each portal window. A `z-modal` inside a portal and a `z-modal`
   inside the main chrome are in separate stacking contexts and do not
   interact.
3. **If UI needs to appear above tab content**, it must be rendered in a
   WebContentsView at a higher ViewLayer (i.e. a portal component window).
   CSS alone cannot solve this.

```
BrowserWindow
 |
 |  Base webContents (browser chrome React app)
 |  ┌─────────────────────────────────────────┐
 |  │ UILayer stacking context (isolated)     │
 |  │  z-controls: resize rails               │
 |  │  z-elevated: floating sidebar, loading  │
 |  │  z-base: topbar, sidebar, content area  │
 |  └─────────────────────────────────────────┘
 |  This entire surface sits BELOW all child views.
 |  Nothing here can appear above tab content via CSS.
 |
 +-- WebContentsView children (ordered by ViewLayer)
      |
      |  ViewLayer.TAB_BACK (0) ........ glance back tab
      |  ViewLayer.TAB (10) ............ normal tab content
      |  ViewLayer.TAB_FRONT (20) ...... glance front tab
      |  ViewLayer.OVERLAY (30) ........ portal component windows
      |  ViewLayer.POPOVER (40) ........ portal popovers
      |  ViewLayer.OMNIBOX (100) ....... command palette
      |
      +-- Each WebContentsView has its own isolated UILayer
          ┌──────────────────────────────────────┐
          │ UILayer stacking context (isolated)  │
          │  Independently uses z-base through   │
          │  z-max, no interaction with other     │
          │  renderers or the base chrome.        │
          └──────────────────────────────────────┘
```

---

## Layer Definitions

### ViewLayer (Electron-level view stacking)

Controls the ordering of `WebContentsView` children within a `BrowserWindow`.
Managed by the `ViewManager`. Values are spaced by 10 to leave room for future
layers without renumbering.

```ts
// src/shared/layers.ts

export const ViewLayer = {
  /** Glance mode: the background tab, rendered behind the active tab */
  TAB_BACK: 0,

  /** Standard tab web content (the page the user is browsing) */
  TAB: 10,

  /** Glance mode: the foreground tab, rendered on top of the back tab */
  TAB_FRONT: 20,

  /** Portal component windows: floating sidebar, toasts, extension popups.
      These are WebContentsViews that render browser chrome UI on top of
      tab content. */
  OVERLAY: 30,

  /** Portal popovers: context menus, dropdowns anchored to overlay content.
      Must be above OVERLAY so a popover triggered from a portal renders
      on top of its parent portal. */
  POPOVER: 40,

  /** The omnibox / command palette. Always the topmost view in the window.
      Nothing should be added above this layer. */
  OMNIBOX: 100
} as const;

export type ViewLayerValue = (typeof ViewLayer)[keyof typeof ViewLayer];
```

#### ViewLayer Invariants

These ordering guarantees must always hold:

```
TAB_BACK < TAB < TAB_FRONT < OVERLAY < POPOVER < OMNIBOX
```

- The omnibox is always the topmost view. No other layer may exceed it.
- Portal popovers are always above portal overlays.
- Portal overlays are always above all tab variants.
- Tab variants are ordered: back < normal < front.

#### ViewLayer Band Ranges

Values between defined layers are reserved for future use. When adding a new
layer, place it within the appropriate band:

| Band   | Range  | Purpose                                                |
| ------ | ------ | ------------------------------------------------------ |
| Tabs   | 0–29   | Tab content variants (back, normal, front, split, pip) |
| Chrome | 30–59  | UI surfaces above tabs (overlays, popovers, panels)    |
| System | 60–100 | System-level surfaces (omnibox, devtools overlays)     |

Example: a future picture-in-picture mini-player could use `ViewLayer.PIP = 15`
(within the Tabs band, above normal tabs but below front/glance). A devtools
overlay could use `ViewLayer.DEVTOOLS = 90` (within the System band, below
omnibox).

---

### UILayer (CSS-level stacking within a renderer)

Controls z-index of elements **within any single renderer process**. Every
renderer — the main browser chrome, the omnibox, each portal window — uses
the same UILayer scale independently. Layers in one renderer do not interact
with layers in another renderer.

```ts
// src/shared/layers.ts (continued)

export const UILayer = {
  /** Default stacking level. Most elements live here. No z-index needed. */
  BASE: 0,

  /** Elements that float above their normal document-flow siblings.
      Examples: floating sidebar (position:fixed over content area),
      loading indicator bar, search suggestion dropdowns, drag-and-drop
      indicator overlays, sticky toolbars. */
  ELEVATED: 10,

  /** Interactive controls that must remain accessible above elevated
      elements. Examples: sidebar resize rails (must be grabbable on top
      of the sidebar container), resize handles, sidebar edge-hover
      detection strips. */
  CONTROLS: 20,

  /** Full-viewport backdrops that dim content behind a modal or sheet.
      Rendered as a semi-transparent overlay covering the entire viewport. */
  SCRIM: 30,

  /** Modal dialogs, sheets, alert dialogs. Content that sits on top of
      a scrim and blocks interaction with elements beneath it. */
  MODAL: 40,

  /** Popovers, dropdown menus, select menus, color pickers. Content
      anchored to a trigger element that floats above everything else,
      including modals (a dropdown inside a modal must render above it). */
  POPOVER: 50,

  /** Tooltips. The highest-priority normal UI element. Must render above
      popovers because a tooltip can appear on a popover trigger. */
  TOOLTIP: 60,

  /** Reserved for developer tools, debug overlays, update animations.
      Nothing in normal UI should use this. */
  MAX: 100
} as const;

export type UILayerValue = (typeof UILayer)[keyof typeof UILayer];
```

#### UILayer vs old names

| Old name | New name     | Rationale                                                                                                                                                                               |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ELEVATED | ELEVATED     | Unchanged. Clear meaning: "above siblings."                                                                                                                                             |
| STICKY   | **CONTROLS** | "Sticky" implies `position: sticky`, but these are resize rails and handles with `position: absolute`. "Controls" accurately describes interactive handles that must remain accessible. |

---

## CSS Integration

### Custom Properties

Inject the UILayer values as CSS custom properties on `:root` so they are
available in plain CSS, Tailwind arbitrary values, and inline styles.

```css
/* src/renderer/src/css/layers.css */

@layer base {
  :root {
    --z-base: 0;
    --z-elevated: 10;
    --z-controls: 20;
    --z-scrim: 30;
    --z-modal: 40;
    --z-popover: 50;
    --z-tooltip: 60;
    --z-max: 100;
  }
}
```

### Tailwind Utilities

Register semantic z-index utilities so developers use names instead of numbers.
These use `@utility` (Tailwind CSS v4 syntax):

```css
/* src/renderer/src/css/layers.css (continued) */

@utility z-base {
  z-index: var(--z-base);
}
@utility z-elevated {
  z-index: var(--z-elevated);
}
@utility z-controls {
  z-index: var(--z-controls);
}
@utility z-scrim {
  z-index: var(--z-scrim);
}
@utility z-modal {
  z-index: var(--z-modal);
}
@utility z-popover {
  z-index: var(--z-popover);
}
@utility z-tooltip {
  z-index: var(--z-tooltip);
}
@utility z-max {
  z-index: var(--z-max);
}
```

Usage in components:

```tsx
// Before
<DialogOverlay className="z-50" />
<DialogContent className="z-50" />
<SidebarRail className="z-20" />
<FloatingSidebar className="z-10" />

// After
<DialogOverlay className="z-scrim" />
<DialogContent className="z-modal" />
<SidebarRail className="z-controls" />
<FloatingSidebar className="z-elevated" />
```

---

## Migration Plan

### Phase 1: Create shared constants and CSS utilities

1. Create `src/shared/layers.ts` with both `ViewLayer` and `UILayer` exports.
2. Create `src/renderer/src/css/layers.css` with custom properties and Tailwind
   utilities.
3. Import `layers.css` in the renderer CSS entrypoint.

### Phase 2: Migrate ViewLayer (Electron-level)

| Current | Constant                    | New                        |
| ------- | --------------------------- | -------------------------- |
| `0`     | `GLANCE_BACK_ZINDEX`        | `ViewLayer.TAB_BACK` (0)   |
| `2`     | `TAB_ZINDEX`                | `ViewLayer.TAB` (10)       |
| `3`     | `GLANCE_FRONT_ZINDEX`       | `ViewLayer.TAB_FRONT` (20) |
| `3`     | `DEFAULT_Z_INDEX` (portals) | `ViewLayer.OVERLAY` (30)   |
| `4`     | (inline, popover.tsx)       | `ViewLayer.POPOVER` (40)   |
| `999`   | (inline, browser.ts)        | `ViewLayer.OMNIBOX` (100)  |

Steps:

1. Delete `GLANCE_FRONT_ZINDEX`, `TAB_ZINDEX`, `GLANCE_BACK_ZINDEX` from
   `tab-layout.ts`. Import from `src/shared/layers.ts`.
2. Delete `DEFAULT_Z_INDEX` from `portal-component-windows.ts` and
   `portal.tsx`. Import `ViewLayer.OVERLAY`.
3. Replace the inline `4` in `popover.tsx` with `ViewLayer.POPOVER`.
4. Replace the inline `999` in `browser.ts` with `ViewLayer.OMNIBOX`.

This resolves the z=3 collision: glance front tabs move to 20, portals move
to 30.

### Phase 3: Migrate UILayer (CSS-level)

Map every existing Tailwind z-index class to its semantic replacement:

| Current                     | New            | Components                                                                                   |
| --------------------------- | -------------- | -------------------------------------------------------------------------------------------- |
| `z-50` (overlays/backdrops) | `z-scrim`      | `dialog.tsx` overlay, `alert-dialog.tsx` overlay, `sheet.tsx` overlay                        |
| `z-50` (modal content)      | `z-modal`      | `dialog.tsx` content, `alert-dialog.tsx` content, `sheet.tsx` content, space/profile editors |
| `z-50` (popover/dropdown)   | `z-popover`    | `popover.tsx`, `dropdown-menu.tsx`, `select.tsx`                                             |
| `z-50` (tooltip)            | `z-tooltip`    | `tooltip.tsx`                                                                                |
| `z-50` (hover detector)     | `z-controls`   | `hover-detector.tsx` (old UI — interactive edge strip)                                       |
| `z-30`                      | `z-popover`    | PDF viewer menus (same semantic role as popovers)                                            |
| `z-20`                      | `z-controls`   | Sidebar resize rails (`sidebar.tsx`, `resizable-sidebar.tsx`), onboarding content            |
| `z-10`                      | `z-elevated`   | Floating sidebar, loading indicator, sidebar containers, drag indicators, search suggestions |
| `z-[5]`                     | Keep or remove | Onboarding background effects (purely decorative, below ELEVATED)                            |
| `-z-10`                     | Keep as-is     | Decorative backgrounds (purely cosmetic, negative z-index is fine)                           |
| `z-index: 999` (CSS)        | `z-max`        | Update animation overlay                                                                     |
| `zIndex: 10` (inline JS)    | `z-elevated`   | Framer Motion `whileDrag` style (space list reordering)                                      |

Steps:

1. Update shadcn/ui primitives (`dialog.tsx`, `sheet.tsx`, `alert-dialog.tsx`,
   `popover.tsx`, `dropdown-menu.tsx`, `select.tsx`, `tooltip.tsx`) to use
   the new utilities.
2. Update browser-ui components (`browser-sidebar`, `main.tsx`,
   `sidebar.tsx`, `resizable-sidebar.tsx`).
3. Update remaining application components file-by-file. Old Tailwind classes
   continue to work during transition; this can be done incrementally.

### Phase 4: Enforce via CI

Add a lint check that flags prohibited patterns (see Enforcement section
below). This is a **required** step, not optional — without it the system
will drift back to magic numbers within weeks.

---

## ViewManager Improvements

The current `ViewManager` re-adds every child view on every z-index change
(O(n) Electron IPC calls per update). This is acceptable at current scale
(~5-10 views) but can be tightened.

### Dirty-flag reordering

Only call `reorderViews()` when the sorted order actually changes, not on
every `addOrUpdateView` call.

```ts
addOrUpdateView(view: WebContentsView, zIndex: number): void {
  const current = this.views.get(view);
  if (current === zIndex) return; // already correct

  this.views.set(view, zIndex);

  // Only reorder if the insertion changed the sorted sequence
  if (this.orderChanged(view, current, zIndex)) {
    this.reorderViews();
  }
}
```

### Batch updates

When multiple views change z-index simultaneously (e.g. switching tab groups
or entering glance mode), defer reordering until all updates are applied.

```ts
batchUpdate(fn: () => void): void {
  this._batching = true;
  fn();
  this._batching = false;
  this.reorderViews();
}
```

**Flush timing contract:** `batchUpdate` is **synchronous**. The callback `fn`
runs synchronously, all `addOrUpdateView` calls within it skip reordering
(because `_batching` is true), and `reorderViews()` is called exactly once
after `fn` returns. There is no deferred/async flush, no microtask, no
`requestAnimationFrame`. The view order is fully consistent before
`batchUpdate` returns.

This means the view ordering is **deterministically updated in a single pass**
before `batchUpdate` returns. Because the Electron main process is
single-threaded, no rendering frame is composited between the individual
`addOrUpdateView` calls and the final `reorderViews()`. In practice, users
will not see intermediate stacking states.

```ts
// Usage:
viewManager.batchUpdate(() => {
  viewManager.addOrUpdateView(frontTab, ViewLayer.TAB_FRONT);
  viewManager.addOrUpdateView(backTab, ViewLayer.TAB_BACK);
});
// View order is fully consistent here.
```

---

## Portal-Specific Rules

Portal component windows are WebContentsViews created via `window.open()` from
the browser chrome renderer. Each portal is a separate renderer process with
its own isolated UILayer stacking context.

### Rules

1. **Default layer:** Portals are created at `ViewLayer.OVERLAY` (30). This
   places them above all tab variants but below popovers and the omnibox.

2. **Popovers from portals:** When a portal needs to show a popover (e.g. a
   context menu triggered from the floating sidebar), it creates a second
   portal at `ViewLayer.POPOVER` (40). This ensures the popover renders above
   its parent portal.

3. **Internal CSS layering:** Each portal uses UILayer independently. A
   `z-modal` inside a portal is z-index 40 within that portal's renderer and
   has no interaction with `z-modal` in the main chrome or any other portal.

4. **Portals never exceed OMNIBOX.** No portal may use a ViewLayer value

   > = `ViewLayer.OMNIBOX`. The omnibox is always the topmost view.

5. **Bounds and visibility:** Portal positioning is controlled via IPC
   (`setComponentWindowBounds`, `setComponentWindowVisible`). The renderer
   measures a sizer element's bounding rect and sends it to the main process.
   This is orthogonal to layering — bounds control where a portal appears,
   ViewLayer controls what it stacks above/below.

### Omnibox Rules

The omnibox is a WebContentsView at `ViewLayer.OMNIBOX` (100) — the highest
layer in the system. It has its own renderer with its own isolated UILayer
stacking context. The following rules apply:

1. **Self-contained renderer.** All omnibox UI — suggestions list, inline
   autocomplete, tooltips, keyboard hints — must render within the omnibox's
   own renderer using UILayer. The omnibox must never spawn portal component
   windows or create additional WebContentsViews.

2. **Nothing above OMNIBOX.** No ViewLayer value may equal or exceed
   `ViewLayer.OMNIBOX` (100). This is an absolute ceiling. If code attempts
   to add a view at >= 100 (other than the omnibox itself), it is a bug.

3. **No escape hatches.** The omnibox cannot use IPC or any other mechanism
   to re-layer itself or other views to circumvent the ViewLayer ordering.
   If the omnibox needs to show complex UI (e.g. a settings panel), it should
   delegate to the main chrome renderer and hide itself, not try to render
   above itself.

---

## Enforcement

Enforcement is required to prevent drift. The system is only as good as its
consistency.

### CI Lint Rule

Add a grep-based check to CI that fails the build if prohibited patterns are
found. This serves as the first line of defense. An ESLint rule for JS/TS
`zIndex` style props is recommended as a future upgrade for better accuracy.

**Prohibited in `.tsx`, `.ts`, `.css` files:**

| Pattern                                        | Why                                                | Allowed exceptions                                                                      |
| ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `z-\d+` (Tailwind, e.g. `z-10`, `z-50`)        | Use semantic names (`z-elevated`, `z-modal`, etc.) | `-z-10` or `-z-\d+` for decorative backgrounds                                          |
| `z-\[.+\]` (Tailwind arbitrary, e.g. `z-[42]`) | Add a named layer if existing ones don't fit       | None                                                                                    |
| `z-index:\s*\d+` (raw CSS)                     | Use `var(--z-*)` custom properties                 | None                                                                                    |
| `zIndex:\s*\d+` (inline JS style)              | Import from `UILayer` or use Tailwind              | `framer-motion` animations where dynamic values are required — use `UILayer.*` constant |

**Implementation:**

```bash
#!/bin/bash
# scripts/lint-z-index.sh

ERRORS=0

# Paths to exclude from checks
EXCLUDE="layers.css\|layers.ts\|node_modules\|\.test\.\|\.spec\.\|__tests__\|\.md$"

# Check for raw Tailwind z-index classes (but not our semantic ones or negative values)
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' --include='*.css' \
  -E '\bz-[0-9]+\b' src/ \
  | grep -v -E '\b-z-[0-9]+\b' \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Raw Tailwind z-index classes found. Use z-elevated, z-modal, etc."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for arbitrary z-index values
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' --include='*.css' \
  -E 'z-\[.+\]' src/ \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Arbitrary z-index values found. Add a named layer to layers.ts."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for raw CSS z-index declarations
MATCHES=$(grep -rn --include='*.css' \
  -E 'z-index:\s*[0-9]+' src/ \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Raw CSS z-index found. Use var(--z-*) custom properties."
  echo "$MATCHES"
  ERRORS=1
fi

# Check for inline JS zIndex with numeric literals
MATCHES=$(grep -rn --include='*.tsx' --include='*.ts' \
  -E 'zIndex:\s*[0-9]+' src/ \
  | grep -v "$EXCLUDE")

if [ -n "$MATCHES" ]; then
  echo "ERROR: Inline numeric zIndex found. Use UILayer.* constants."
  echo "$MATCHES"
  ERRORS=1
fi

exit $ERRORS
```

**Recommended future upgrade:** Add an ESLint rule (or Stylelint rule) that
catches `zIndex` in style objects and JSX style props at the AST level. This
eliminates false negatives from template literals, computed values, and
variable indirection that grep cannot catch. The grep script remains useful
as a fast, zero-dependency baseline.

### Code Review Checklist

When reviewing PRs that touch z-index or layering:

- [ ] Does it use `ViewLayer.*` or `z-*` semantic utilities?
- [ ] If a new layer was added, is it documented in `layers.ts` with JSDoc?
- [ ] If a portal is involved, does it respect the OMNIBOX ceiling?
- [ ] Does the change maintain all ViewLayer invariants?

---

## Guidelines for Future Development

### When to use ViewLayer vs UILayer

- **ViewLayer** is for content that renders in its own `WebContentsView`
  (tabs, portals, omnibox). You control stacking by passing a `ViewLayer`
  value to `viewManager.addOrUpdateView()`.
- **UILayer** is for elements within a single React renderer. You control
  stacking with the `z-*` Tailwind utilities (`z-elevated`, `z-modal`, etc.).
- **Never mix the two.** A CSS `z-index: 9999` inside the base renderer
  will never make an element appear above a `WebContentsView` child. Use a
  portal component window if you need to overlay tab content.

### Adding a new ViewLayer

1. Identify which band the layer belongs to (Tabs 0–29, Chrome 30–59,
   System 60–100).
2. Add the constant to `ViewLayer` in `src/shared/layers.ts` with a JSDoc
   comment explaining its purpose.
3. Verify the invariant ordering still holds.

### Adding a new UILayer

1. Add the constant to `UILayer` in `src/shared/layers.ts`.
2. Add the CSS custom property to `src/renderer/src/css/layers.css`.
3. Add the `@utility` directive in the same file.
4. Document the layer's purpose in the JSDoc comment.

### Prohibited patterns

- **No raw z-index numbers.** Always use `ViewLayer.*` or `z-*` utilities.
  The only exception is negative z-index for purely decorative backgrounds.
- **No arbitrary Tailwind z-index** (`z-[42]`). If the existing layers do not
  fit, add a new named layer.
- **No sentinel values** (`z-index: 999`). The layer scale is compact
  (0–100) and intentional.

---

## File Structure

```
src/shared/layers.ts              # ViewLayer + UILayer constants (single source of truth)
src/renderer/src/css/layers.css   # CSS custom properties + Tailwind @utility definitions
scripts/lint-z-index.sh           # CI enforcement script
```

Everything else imports from these files. No other file should define a
z-index constant or use a raw z-index number.

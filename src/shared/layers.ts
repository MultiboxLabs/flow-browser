// ─── ViewLayer (Electron-level view stacking) ───────────────────────────
//
// Controls the ordering of WebContentsView children within a BrowserWindow.
// Managed by the ViewManager. Values are spaced by 10 to leave room for
// future layers without renumbering.
//
// Band ranges:
//   Tabs   (0–29)   — Tab content variants (back, normal, front, split, pip)
//   Chrome (30–59)  — UI surfaces above tabs (overlays, popovers, panels)
//   System (60–100) — System-level surfaces (omnibox, devtools overlays)
//
// Invariants: TAB_BACK < TAB < TAB_FRONT < OVERLAY < POPOVER < OMNIBOX

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

// ─── UILayer (CSS-level stacking within a renderer) ─────────────────────
//
// Controls z-index of elements within any single renderer process. Every
// renderer — the main browser chrome, the omnibox, each portal window —
// uses the same UILayer scale independently. Layers in one renderer do
// not interact with layers in another renderer.

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

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

// For LayerManager
export const zIndexes = {
  // Overlays
  omnibox: 100,
  popover: 99,
  floatingSidebar: 30,

  // Tab Overlays
  webPrompt: 22,
  passkeyConditionalUI: 21,
  findInPage: 20,

  // Tab Content
  tabTargetUrlIndicator: 11,
  tab: 10,
  tabBack: 9,

  // Browser UI
  browserUI: 0
} as const satisfies Record<string, number>;

export type LayerType = keyof typeof zIndexes;

export const focusPriorities = {
  // Overlays
  omnibox: 100,
  popover: 99,
  floatingSidebar: 0,

  // Tab Overlays
  webPrompt: 22,
  passkeyConditionalUI: 0,
  findInPage: 20,

  // Tab Content
  tabTargetUrlIndicator: 0,
  tab: 10,
  tabBack: 9,

  // Browser UI
  browserUI: 0
} as const satisfies Record<LayerType, number>;

export function createModalTo(layerType: LayerType) {
  switch (layerType) {
    case "popover":
      return (zIndex: number) => {
        if (zIndex === zIndexes.omnibox) {
          return false;
        }
        return true;
      };
    case "webPrompt":
      // Web Prompts are modal to tab layers
      return (zIndex: number) => {
        const modalToLayers: LayerType[] = [
          "passkeyConditionalUI",
          "findInPage",
          "tabTargetUrlIndicator",
          "tab",
          "tabBack"
        ];
        for (const layer of modalToLayers) {
          const layerZIndex = zIndexes[layer];
          if (layerZIndex === zIndex) {
            return true;
          }
        }
        return false;
      };
    default:
      return () => false;
  }
}

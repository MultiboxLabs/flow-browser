export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Interface for the Flow API exposed by the Electron preload script
 */
interface FlowAPI {
  /**
   * Sets the bounds of the page content
   * Similar to setTabBounds but specifically for the page content area
   * This can only be called from the Browser UI
   * @param bounds The bounds object containing position and dimensions
   */
  setPageBounds: (bounds: PageBounds) => void;
}

declare global {
  /**
   * The Flow API instance exposed by the Electron preload script
   * This is defined in electron/preload.ts and exposed via contextBridge
   */
  const flow: FlowAPI;
}

export function setPageBounds(bounds: PageBounds) {
  return flow.setPageBounds(bounds);
}

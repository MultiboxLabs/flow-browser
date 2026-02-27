import { PageBounds, PageLayoutParams } from "~/flow/types";

// API //
export interface FlowPageAPI {
  /**
   * Sets the bounds of the page content directly (legacy path).
   * Used by the old browser UI which has a different layout structure.
   * @param bounds The bounds object containing position and dimensions
   */
  setPageBounds: (bounds: PageBounds) => void;

  /**
   * Sets declarative layout parameters for the page content area.
   * The main process computes exact pixel bounds from these parameters
   * and the window's content size, eliminating getBoundingClientRect()
   * from the critical path.
   *
   * See design/DECLARATIVE_PAGE_BOUNDS.md for the full design.
   * @param params The layout parameters describing the UI structure
   */
  setLayoutParams: (params: PageLayoutParams) => void;
}

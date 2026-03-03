import { PageBounds } from "~/flow/types";

type QueryParams = { [key: string]: string };

/** Parameters sent from main → renderer when the omnibox should be shown. */
export interface OmniboxShowParams {
  /** Pre-filled text for the input field (e.g. current URL). */
  currentInput: string | null;
  /** Where selected results should open. */
  openIn: "current" | "new_tab";
}

// API //
export interface FlowOmniboxAPI {
  /**
   * Shows the omnibox (renderer → main).
   */
  show: (bounds: PageBounds | null, params: QueryParams | null) => void;

  /**
   * Hides the omnibox (renderer → main).
   */
  hide: () => void;

  /**
   * Register a listener for when the omnibox should be shown (main → renderer).
   * Returns a cleanup function.
   */
  onShow: (callback: (params: OmniboxShowParams) => void) => () => void;

  /**
   * Register a listener for when the omnibox should be hidden (main → renderer).
   * Returns a cleanup function.
   */
  onHide: (callback: () => void) => () => void;
}

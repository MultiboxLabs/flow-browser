import { PageBounds } from "~/flow/types";

// Options //
export interface OmniboxShowOptions {
  /** Position and size of the omnibox. If omitted, the omnibox is centered in the window. */
  bounds?: PageBounds;
  /** Pre-fill the omnibox input field with this text. */
  currentInput?: string;
  /** Whether the selected match should open in the current tab or a new tab. Defaults to "new_tab". */
  openIn?: "current" | "new_tab";
}

// API //
export interface FlowOmniboxAPI {
  /**
   * Shows the omnibox with the given options.
   * If the omnibox is already visible, it will be re-shown with the new options.
   */
  show: (options?: OmniboxShowOptions) => void;

  /**
   * Hides the omnibox.
   */
  hide: () => void;

  /**
   * Registers a callback that fires when the omnibox is shown.
   * The callback receives the show options (currentInput, openIn, etc.).
   * Returns an unsubscribe function.
   *
   * Intended for use by the omnibox renderer only.
   */
  onShow: (callback: (options: OmniboxShowOptions) => void) => () => void;

  /**
   * Registers a callback that fires when the omnibox is hidden.
   * Returns an unsubscribe function.
   *
   * Intended for use by the omnibox renderer only.
   */
  onHide: (callback: () => void) => () => void;
}

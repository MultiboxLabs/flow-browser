import { PageBounds } from "~/flow/types";

type QueryParams = { [key: string]: string };

// API //
export interface FlowOmniboxAPI {
  /**
   * Shows the omnibox
   */
  show: (bounds: PageBounds | null, params: QueryParams | null) => void;

  /**
   * Hides the omnibox
   */
  hide: () => void;
}

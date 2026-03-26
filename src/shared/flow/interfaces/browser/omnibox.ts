import { PageBounds, IPCListener } from "~/flow/types";

type QueryParams = { [key: string]: string };
export type OmniboxOpenIn = "current" | "new_tab";
export type OmniboxShadowPadding = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type OmniboxOpenState = {
  currentInput: string;
  openIn: OmniboxOpenIn;
  sequence: number;
  shadowPadding: OmniboxShadowPadding;
};

// API //
export interface FlowOmniboxAPI {
  /**
   * Shows the omnibox
   */
  show: (bounds: PageBounds | null, params: QueryParams | null) => void;

  /**
   * Gets the current omnibox open state.
   */
  getState: () => Promise<OmniboxOpenState>;

  /**
   * Listens for omnibox open-state changes.
   */
  onStateChanged: IPCListener<[OmniboxOpenState]>;

  /**
   * Hides the omnibox
   */
  hide: () => void;
}

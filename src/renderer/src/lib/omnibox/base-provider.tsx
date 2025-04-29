import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput } from "@/lib/omnibox/types";

/** Interface for components that generate autocomplete suggestions. */
export interface AutocompleteProvider {
  name: string;
  /**
   * Starts generating suggestions for the given input.
   * Results are sent asynchronously via the onResults callback.
   */
  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void;
  /**
   * Stops any ongoing asynchronous operations for the current query.
   */
  stop(): void;
}

export abstract class BaseProvider implements AutocompleteProvider {
  abstract name: string;

  abstract start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void;

  abstract stop(): void;
}

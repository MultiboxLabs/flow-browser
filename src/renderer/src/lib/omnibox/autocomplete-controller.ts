import { AutocompleteResult } from "@/lib/omnibox/autocomplete-result";
import { AutocompleteProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { ZeroSuggestProvider } from "@/lib/omnibox/providers/zero-suggest";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { generateUUID } from "@/lib/utils";

/** Orchestrates suggestion generation from multiple providers. */
export class AutocompleteController {
  private providers: AutocompleteProvider[];
  private currentResult: AutocompleteResult = new AutocompleteResult();
  private onUpdate: OmniboxUpdateCallback;
  private activeProviders: number = 0;
  public currentInput: AutocompleteInput | null = null;
  private currentRequestId: string = "";
  constructor(providers: AutocompleteProvider[], onUpdate: OmniboxUpdateCallback) {
    // Order might matter based on desired speed/priority, though they run in parallel
    this.providers = providers;
    this.onUpdate = onUpdate;
  }

  /** Starts a new autocomplete query for the given input. */
  start(input: AutocompleteInput): void {
    console.log(`AutocompleteController: Starting query for "${input.text}" (type: ${input.type})`);
    this.stop(); // Stop any previous query

    this.currentInput = input;
    this.currentResult.clear();
    this.activeProviders = 0;

    const requestId = generateUUID();
    this.currentRequestId = requestId;

    // Special handling for ZeroSuggest on focus
    if (input.type === "focus" && input.text === "") {
      const zeroSuggestProvider = this.providers.find((p) => p instanceof ZeroSuggestProvider);
      if (zeroSuggestProvider) {
        this.activeProviders++;
        // Bind `this` to ensure correct context in the callback
        zeroSuggestProvider.start(input, (results, continuous) => {
          this.onProviderResults(zeroSuggestProvider, requestId, results, continuous);
        });
      }
    } else {
      // Start all relevant providers for non-focus/non-empty input
      this.providers.forEach((provider) => {
        // Don't run ZeroSuggestProvider on normal input
        if (provider instanceof ZeroSuggestProvider) return;

        // Maybe add more logic here: e.g., disable search provider if offline?
        this.activeProviders++;
        // Bind `this` to ensure correct context in the callback
        provider.start(input, (results, continuous) => {
          this.onProviderResults(provider, requestId, results, continuous);
        });
      });
    }

    // Initial update (e.g., with verbatim match)
    this.updateResults();
  }

  /** Stops the current autocomplete query and cancels provider operations. */
  stop(): void {
    if (this.activeProviders > 0) {
      console.log("AutocompleteController: Stopping active providers.");
      this.providers.forEach((provider) => provider.stop());
      this.activeProviders = 0;
      this.currentInput = null;
    }
  }

  /** Callback invoked when a provider returns results. */
  private onProviderResults(
    provider: AutocompleteProvider,
    requestId: string,
    matches: AutocompleteMatch[],
    continuous?: boolean
  ): void {
    if (requestId !== this.currentRequestId) {
      return;
    }

    // Ignore results if the query has already been stopped or input changed
    // (Simplified check; a real system might use query IDs)
    if (this.activeProviders === 0) {
      // console.log(`AutocompleteController: Ignoring stale results from ${provider.name}`);
      return;
    }

    console.log(`AutocompleteController: Received ${matches.length} results from ${provider.name}`);
    this.currentResult.addMatches(matches);

    if (!continuous) {
      this.activeProviders--;
    }

    this.updateResults();

    if (this.activeProviders === 0) {
      console.log("AutocompleteController: All providers finished.");
      // Can perform final cleanup or logging here
    }
  }

  /** Merges, sorts, deduplicates, and sends results to the UI callback. */
  private updateResults(): void {
    this.currentResult.deduplicate(); // Deduplicate based on current matches
    this.currentResult.sort(); // Sort by relevance
    this.onUpdate(this.currentResult.getTopMatches()); // Notify listener
  }
}

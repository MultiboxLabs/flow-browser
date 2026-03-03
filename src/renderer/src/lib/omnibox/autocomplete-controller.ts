import { AutocompleteResult } from "@/lib/omnibox/autocomplete-result";
import { AutocompleteProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { ZeroSuggestProvider } from "@/lib/omnibox/providers/zero-suggest";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { generateUUID } from "@/lib/utils";

/** Provider timing information for debug/diagnostics. */
export interface ProviderTiming {
  providerName: string;
  startTime: number;
  endTime: number;
  matchCount: number;
}

/** Orchestrates suggestion generation from multiple providers. */
export class AutocompleteController {
  private providers: AutocompleteProvider[];
  private currentResult: AutocompleteResult = new AutocompleteResult();
  private onUpdate: OmniboxUpdateCallback;
  private activeProviders: number = 0;
  public currentInput: AutocompleteInput | null = null;
  private currentRequestId: string = "";

  // --- Default match stability (design doc section 9) ---

  /** The current default (top) match, used for stability enforcement. */
  private defaultMatch: AutocompleteMatch | null = null;

  /** Whether the user is currently navigating with arrow keys. */
  private _userIsNavigating: boolean = false;

  /** Buffered result updates received while the user is navigating. */
  private pendingMatches: AutocompleteMatch[][] = [];

  // --- Provider timing diagnostics ---

  /** Timing data for the most recent query. */
  private _providerTimings: ProviderTiming[] = [];
  private providerStartTimes: Map<string, number> = new Map();

  constructor(providers: AutocompleteProvider[], onUpdate: OmniboxUpdateCallback) {
    this.providers = providers;
    this.onUpdate = onUpdate;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Whether the user is navigating with arrow keys. */
  get userIsNavigating(): boolean {
    return this._userIsNavigating;
  }

  /** Provider timings for the most recent query (for debug page). */
  get providerTimings(): ProviderTiming[] {
    return this._providerTimings;
  }

  /** Starts a new autocomplete query for the given input. */
  start(input: AutocompleteInput): void {
    console.log(`AutocompleteController: Starting query for "${input.text}" (trigger: ${input.trigger})`);
    this.stop(); // Stop any previous query

    this.currentInput = input;
    this.currentResult.clear();
    this.activeProviders = 0;
    this._providerTimings = [];
    this.providerStartTimes.clear();

    // Reset default match on new query (input has changed)
    this.defaultMatch = null;

    const requestId = generateUUID();
    this.currentRequestId = requestId;

    // Special handling for ZeroSuggest on focus with empty input
    if (input.trigger === "focus" && input.text === "") {
      const zeroSuggestProvider = this.providers.find((p) => p instanceof ZeroSuggestProvider);
      if (zeroSuggestProvider) {
        this.activeProviders++;
        this.providerStartTimes.set(zeroSuggestProvider.name, performance.now());
        zeroSuggestProvider.start(input, (results, continuous) => {
          this.onProviderResults(zeroSuggestProvider, requestId, results, continuous);
        });
      }
    } else {
      // Start all relevant providers for non-focus/non-empty input
      this.providers.forEach((provider) => {
        // Don't run ZeroSuggestProvider on normal input
        if (provider instanceof ZeroSuggestProvider) return;

        this.activeProviders++;
        this.providerStartTimes.set(provider.name, performance.now());
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

  /**
   * Called when the user presses an arrow key (navigating the results list).
   * Suppresses result updates until the next keystroke.
   */
  onUserArrowKey(): void {
    this._userIsNavigating = true;
  }

  /**
   * Called when the user types a character.
   * Clears the navigation lock and applies any pending updates before processing.
   */
  onUserKeystroke(input: AutocompleteInput): void {
    this._userIsNavigating = false;
    this.applyPendingUpdates();
    this.start(input);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

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

    if (this.activeProviders === 0) {
      return;
    }

    // Record timing
    const startTime = this.providerStartTimes.get(provider.name) ?? performance.now();
    this._providerTimings.push({
      providerName: provider.name,
      startTime,
      endTime: performance.now(),
      matchCount: matches.length
    });

    console.log(`AutocompleteController: Received ${matches.length} results from ${provider.name}`);

    // If the user is navigating, buffer updates instead of applying them
    if (this._userIsNavigating) {
      this.pendingMatches.push(matches);
      if (!continuous) {
        this.activeProviders--;
      }
      return;
    }

    this.currentResult.addMatches(matches);

    if (!continuous) {
      this.activeProviders--;
    }

    this.updateResults();

    if (this.activeProviders === 0) {
      console.log("AutocompleteController: All providers finished.");
    }
  }

  /** Apply any updates that were buffered while the user was navigating. */
  private applyPendingUpdates(): void {
    if (this.pendingMatches.length === 0) return;

    for (const matches of this.pendingMatches) {
      this.currentResult.addMatches(matches);
    }
    this.pendingMatches = [];
    this.updateResults();
  }

  /**
   * Determine whether the default match should be updated.
   * Implements design doc section 9.2:
   *   - Always update if there's no current default
   *   - Always update if the current default is a verbatim/what-you-typed (low confidence)
   *   - Update if the new top match exceeds the current default by >100 points
   *   - For short inputs (1-2 chars), require >1300 relevance for a non-verbatim default
   */
  private shouldUpdateDefault(newTop: AutocompleteMatch): boolean {
    if (!this.defaultMatch) return true;

    // Always allow replacement of low-confidence defaults
    if (this.defaultMatch.type === "verbatim" || this.defaultMatch.type === "url-what-you-typed") {
      return true;
    }

    // Allow update if the new match significantly exceeds the current default
    if (newTop.relevance > this.defaultMatch.relevance + 100) {
      return true;
    }

    return false;
  }

  /** Merges, sorts, deduplicates, and sends results to the UI callback. */
  private updateResults(): void {
    this.currentResult.deduplicate();
    this.currentResult.sort();

    const topMatches = this.currentResult.getTopMatches();

    // --- Default match stability ---
    if (topMatches.length > 0) {
      const newTop = topMatches[0];
      const inputLength = this.currentInput?.text.length ?? 0;

      // Short input caution: for 1-2 char inputs, require >1300 relevance
      // for a non-verbatim default
      const shortInputCaution =
        inputLength <= 2 &&
        newTop.type !== "verbatim" &&
        newTop.type !== "url-what-you-typed" &&
        newTop.relevance <= 1300;

      if (this.shouldUpdateDefault(newTop) && !shortInputCaution) {
        this.defaultMatch = { ...newTop };
        topMatches[0].isDefault = true;
      } else if (this.defaultMatch) {
        // Preserve the current default at position 0
        const defaultIdx = topMatches.findIndex(
          (m) => m.destinationUrl === this.defaultMatch!.destinationUrl && m.type === this.defaultMatch!.type
        );
        if (defaultIdx > 0) {
          // Move existing default to top
          const [existing] = topMatches.splice(defaultIdx, 1);
          existing.isDefault = true;
          topMatches.unshift(existing);
        } else if (defaultIdx === -1) {
          // Default is no longer in results — accept the new top
          this.defaultMatch = { ...newTop };
          topMatches[0].isDefault = true;
        } else {
          // defaultIdx === 0, already at top
          topMatches[0].isDefault = true;
        }
      }
    } else {
      this.defaultMatch = null;
    }

    this.onUpdate(topMatches);
  }
}

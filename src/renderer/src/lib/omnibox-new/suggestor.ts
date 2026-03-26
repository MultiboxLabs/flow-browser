import { flushSearchSuggestions } from "./suggestors/search-suggestions";
import { type OmniboxFlush } from "./helpers";
import { getPedalSuggestions, getQuickHistorySuggestions, getVerbatimSuggestions } from "./suggestors";

/**
 * Produce omnibox rows for the current input. Call `flush` whenever the list changes
 * (once or multiple times for incremental updates).
 *
 * For async work, pass a `flush` wrapped with {@link guardOmniboxFlush} at the call
 * site so stale completions cannot overwrite a newer query.
 */
export function getOmniboxSuggestions(input: string, flush: OmniboxFlush): void {
  const trimmedInput = input.trim();
  if (!trimmedInput) {
    flush([]);
    return;
  }

  // Initial suggestions (verbatim, quick history, and pedal)
  const verbatimSuggestions = getVerbatimSuggestions(trimmedInput);
  const quickHistorySuggestions = getQuickHistorySuggestions(trimmedInput);
  const pedalSuggestions = getPedalSuggestions(trimmedInput);
  flush([...verbatimSuggestions, ...quickHistorySuggestions, ...pedalSuggestions]);

  // Asynchronous suggestions (search)
  flushSearchSuggestions(trimmedInput, flush);
}

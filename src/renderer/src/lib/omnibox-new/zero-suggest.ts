import { getZeroSuggestHistorySuggestions } from "./suggestors/quick-history";
import { getZeroSuggestOpenTabSuggestions } from "./suggestors/open-tabs";
import { type OmniboxFlush } from "./helpers";

export function getZeroSuggestSuggestions(flush: OmniboxFlush): void {
  const openTabSuggestions = getZeroSuggestOpenTabSuggestions();
  const historySuggestions = getZeroSuggestHistorySuggestions();
  flush([...openTabSuggestions, ...historySuggestions]);
}

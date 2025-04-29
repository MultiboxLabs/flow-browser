import { AutocompleteMatch } from "@/lib/omnibox/types";

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput } from "@/lib/omnibox/types";
import { getOpenTabsInSpace } from "@/lib/omnibox/data-providers/open-tabs";
import { getStringSimilarity } from "@/lib/omnibox/data-providers/string-similarity";

export class OpenTabProvider extends BaseProvider {
  name = "OpenTabProvider";

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;
    const inputTextLowered = inputText.toLowerCase();
    if (inputText.length < 3) {
      // Don't suggest for very short input
      onResults([]);
      return;
    }

    getOpenTabsInSpace().then((tabs) => {
      // Search open tabs (should be fast)
      const results: AutocompleteMatch[] = [];
      for (const tab of tabs) {
        const titleLower = tab.title.toLowerCase();
        const urlLower = tab.url.toLowerCase();

        const titleSimilarity = getStringSimilarity(inputTextLowered, titleLower);
        const urlSimilarity = getStringSimilarity(inputTextLowered, urlLower);
        const bestSimilarity = Math.max(titleSimilarity, urlSimilarity);

        if (bestSimilarity > 0) {
          // High relevance to encourage switching tabs, scaled by similarity
          let relevance = Math.min(1500, Math.ceil(1100 + bestSimilarity * 300));

          if (!urlLower.includes(inputTextLowered)) {
            // Caps relevance at 1200 if the URL doesn't match
            relevance = Math.min(1200, relevance);
          }

          results.push({
            providerName: this.name,
            relevance, // High relevance to encourage switching tabs
            contents: tab.title,
            description: `Switch to this tab - ${tab.url}`,
            // Destination URL will be parsed by the omnibox to switch to the tab
            destinationUrl: `${tab.spaceId}:${tab.id}`,
            type: "open-tab",
            isDefault: true // Often becomes the default action if matched
          });
        }
      }
      onResults(results);
    });
  }

  stop(): void {
    // No ongoing operations to stop
  }
}

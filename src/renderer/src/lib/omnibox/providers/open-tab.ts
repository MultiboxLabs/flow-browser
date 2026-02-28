import { AutocompleteMatch } from "@/lib/omnibox/types";

import { BaseProvider } from "@/lib/omnibox/base-provider";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput } from "@/lib/omnibox/types";
import { getOpenTabsInSpace } from "@/lib/omnibox/data-providers/open-tabs";
import { tokenize, allTermsMatch, findBestMatch } from "@/lib/omnibox/tokenizer";

export class OpenTabProvider extends BaseProvider {
  name = "OpenTabProvider";

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;
    if (!inputText.trim()) {
      onResults([]);
      return;
    }

    // Use pre-tokenized terms from the input
    const terms = input.terms;
    if (terms.length === 0) {
      onResults([]);
      return;
    }

    getOpenTabsInSpace().then((tabs) => {
      const results: AutocompleteMatch[] = [];
      for (const tab of tabs) {
        const titleTokens = tokenize(tab.title);
        const urlTokens = tokenize(tab.url);
        const allTokens = [...titleTokens, ...urlTokens];

        if (!allTermsMatch(terms, allTokens)) continue;

        // Calculate match quality based on best match types
        let matchScore = 0;
        for (const term of terms) {
          const titleMatch = findBestMatch(term, titleTokens);
          const urlMatch = findBestMatch(term, urlTokens);

          // Pick the best match between title and URL
          const best =
            titleMatch === "exact" || urlMatch === "exact"
              ? "exact"
              : titleMatch === "prefix" || urlMatch === "prefix"
                ? "prefix"
                : "substring";

          if (best === "exact") matchScore += 1.0;
          else if (best === "prefix") matchScore += 0.7;
          else matchScore += 0.4;
        }
        // Normalize to 0..1
        const normalizedScore = matchScore / terms.length;

        // High relevance to encourage switching tabs, scaled by match quality
        let relevance = Math.min(1500, Math.ceil(1100 + normalizedScore * 400));

        // Check if the URL contains the raw input text for a relevance boost
        const urlLower = tab.url.toLowerCase();
        const inputTextLowered = inputText.toLowerCase();
        if (!urlLower.includes(inputTextLowered)) {
          relevance = Math.min(1200, relevance);
        }

        results.push({
          providerName: this.name,
          relevance,
          contents: tab.title,
          description: `Switch to this tab - ${tab.url}`,
          destinationUrl: `${tab.spaceId}:${tab.id}`,
          type: "open-tab",
          isDefault: true
        });
      }
      onResults(results);
    });
  }

  stop(): void {
    // No ongoing operations to stop
  }
}

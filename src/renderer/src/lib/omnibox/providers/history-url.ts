import { BaseProvider } from "@/lib/omnibox/base-provider";
import { getHistory } from "@/lib/omnibox/data-providers/history";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { getURLFromInput } from "@/lib/url";
import { getStringSimilarity } from "@/lib/omnibox/data-providers/string-similarity";

export class HistoryURLProvider extends BaseProvider {
  name = "HistoryURLProvider";

  start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const inputText = input.text;
    const inputTextLowered = inputText.toLowerCase();
    if (!inputText) {
      onResults([]);
      return;
    }

    const url = getURLFromInput(inputText);
    if (url) {
      const typedURLMatch: AutocompleteMatch = {
        providerName: this.name,
        relevance: 1300, // High score to appear near top, but below strong nav
        contents: inputText,
        description: "Open URL",
        destinationUrl: url,
        type: "url-what-you-typed", // Special type for clarity, often treated as search
        isDefault: true // Usually the fallback default action
      };
      onResults([typedURLMatch], true); // Send typed URL immediately
    }

    getHistory().then((history) => {
      const results: AutocompleteMatch[] = [];
      for (const entry of history) {
        const urlLower = entry.url.toLowerCase();
        const titleLower = entry.title?.toLowerCase() ?? "";

        // Calculate similarity against URL and Title
        const urlSimilarity = getStringSimilarity(inputTextLowered, urlLower);
        const titleSimilarity = titleLower ? getStringSimilarity(inputTextLowered, titleLower) : 0;
        const bestSimilarity = Math.max(urlSimilarity, titleSimilarity);

        // Match if similarity is above threshold OR if it's a prefix match (for URL typing)
        const isPrefixMatch =
          urlLower.startsWith(inputTextLowered) ||
          urlLower.startsWith("http://" + inputTextLowered) ||
          urlLower.startsWith("https://" + inputTextLowered);

        if (bestSimilarity > 0 || isPrefixMatch) {
          // Base score on counts, boost significantly by similarity
          // Range similar to pedals (1100-1200) + count bonuses
          // Let's aim for base 900 + similarity * 300 + counts * 10? Capped around 1450?
          const similarityScore = Math.ceil(900 + bestSimilarity * 300);
          let relevance = similarityScore + entry.typedCount * 10 + entry.visitCount;

          // Boost exact matches significantly for inline autocompletion
          if (
            urlLower === inputTextLowered ||
            urlLower === "http://" + inputTextLowered ||
            urlLower === "https://" + inputTextLowered
          ) {
            relevance = Math.max(relevance + 200, 1400); // Ensure high score for exact match
          } else if (isPrefixMatch) {
            // Give prefix matches a smaller boost
            relevance = Math.max(relevance + 50, similarityScore + 50);
          }

          relevance = Math.min(relevance, 1450); // Cap general suggestions

          results.push({
            providerName: this.name,
            relevance: relevance,
            contents: entry.url, // Display URL
            description: entry.title, // Display title
            destinationUrl: entry.url,
            type: "history-url",
            // Offer inline completion for strong prefix matches based on URL
            inlineCompletion: isPrefixMatch && entry.url.length > inputText.length ? entry.url : undefined,
            isDefault: relevance > 1400 // Good candidate for default if score is very high
          });
        }
      }

      // Sort locally by relevance before sending back (providers might do this)
      results.sort((a, b) => b.relevance - a.relevance);
      onResults(results);
    });
  }

  stop(): void {
    // No ongoing operations to stop
  }
}

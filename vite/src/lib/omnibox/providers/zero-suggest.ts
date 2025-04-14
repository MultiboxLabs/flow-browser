import { BaseProvider } from "@/lib/omnibox/base-provider";
import { getHistory } from "@/lib/omnibox/data-providers/history";
import { getOpenTabsInSpace } from "@/lib/omnibox/data-providers/open-tabs";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";

export class ZeroSuggestProvider extends BaseProvider {
  name = "ZeroSuggestProvider";

  start(_input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const findSuggestions = async () => {
      // Get open tabs
      await getOpenTabsInSpace().then((tabs) => {
        const tabResults: AutocompleteMatch[] = [];

        // Suggest up to 10 recent open tabs
        const recentTabs = tabs.slice(0, 10);
        recentTabs.forEach((tab, index) => {
          tabResults.push({
            providerName: this.name,
            relevance: 800 - index * 50, // Higher relevance than history
            contents: tab.title,
            description: `Switch to this tab - ${tab.url}`,
            destinationUrl: `${tab.spaceId}:${tab.id}`,
            type: "open-tab"
          });
        });

        onResults(tabResults, true);
      });

      // Get history
      await getHistory().then((history) => {
        const results: AutocompleteMatch[] = [];

        // Suggest top 5most visited sites from history
        const mostVisited = history.sort((a, b) => b.visitCount - a.visitCount).slice(0, 5);
        mostVisited.forEach((entry, index) => {
          results.push({
            providerName: this.name,
            relevance: 700 - index * 50, // Lower relevance than typed queries
            contents: entry.title,
            description: entry.url,
            destinationUrl: entry.url,
            type: "zero-suggest"
          });
        });

        onResults(results);
      });
    };

    findSuggestions();
  }

  stop(): void {
    // No ongoing operations to stop
  }
}

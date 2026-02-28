import { BaseProvider } from "@/lib/omnibox/base-provider";
import { getRecentHistory, getMostVisitedHistory } from "@/lib/omnibox/data-providers/history";
import { getOpenTabsInSpace } from "@/lib/omnibox/data-providers/open-tabs";
import { OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteInput, AutocompleteMatch } from "@/lib/omnibox/types";
import { calculateSimpleFrecency } from "@/lib/omnibox/frecency";
import { normalizeUrlForDedup } from "@/lib/omnibox/url-normalizer";

export class ZeroSuggestProvider extends BaseProvider {
  name = "ZeroSuggestProvider";

  start(_input: AutocompleteInput, onResults: OmniboxUpdateCallback): void {
    const findSuggestions = async () => {
      // Get open tabs first (fast, local)
      try {
        const tabs = await getOpenTabsInSpace();
        const tabResults: AutocompleteMatch[] = [];

        // Suggest up to 5 recent open tabs
        const recentTabs = tabs.slice(0, 5);
        recentTabs.forEach((tab, index) => {
          tabResults.push({
            providerName: this.name,
            relevance: 800 - index * 50,
            contents: tab.title,
            description: `Switch to this tab - ${tab.url}`,
            destinationUrl: `${tab.spaceId}:${tab.id}`,
            type: "open-tab",
            dedupKey: `tab:${tab.id}`
          });
        });

        onResults(tabResults, true);
      } catch {
        // Tab fetch failed, continue
      }

      // Get most visited from real history
      try {
        const [mostVisited, recent] = await Promise.all([getMostVisitedHistory(10), getRecentHistory(10)]);

        // Merge and deduplicate: prefer most visited, fill with recent
        const seen = new Set<string>();
        const historyResults: AutocompleteMatch[] = [];

        // Score most visited by frecency
        const scored = mostVisited.map((entry) => ({
          entry,
          frecency: calculateSimpleFrecency(entry.visitCount, entry.lastVisitTime)
        }));
        scored.sort((a, b) => b.frecency - a.frecency);

        for (const { entry } of scored) {
          const dedupKey = normalizeUrlForDedup(entry.url);
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          historyResults.push({
            providerName: this.name,
            relevance: 700 - historyResults.length * 40,
            contents: entry.title || entry.url,
            description: entry.url,
            destinationUrl: entry.url,
            type: "zero-suggest",
            dedupKey
          });

          if (historyResults.length >= 5) break;
        }

        // Fill remaining slots with recent history
        for (const entry of recent) {
          if (historyResults.length >= 8) break;
          const dedupKey = normalizeUrlForDedup(entry.url);
          if (seen.has(dedupKey)) continue;
          seen.add(dedupKey);

          historyResults.push({
            providerName: this.name,
            relevance: 500 - (historyResults.length - 5) * 40,
            contents: entry.title || entry.url,
            description: entry.url,
            destinationUrl: entry.url,
            type: "zero-suggest",
            dedupKey
          });
        }

        onResults(historyResults);
      } catch {
        // History fetch failed, send empty
        onResults([]);
      }
    };

    findSuggestions();
  }

  stop(): void {
    // No ongoing operations to stop
  }
}

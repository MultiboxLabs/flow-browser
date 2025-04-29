// THIS IS NOT BEING USED, STORED HERE FOR REFERENCE!

// ========= Interfaces and Types =========

/** Represents the input state for an autocomplete query. */
export interface AutocompleteInput {
  text: string; // The text entered by the user
  currentURL?: string; // The URL of the current page (context)
  type: "focus" | "keystroke"; // Why the query is being run
  preventInlineAutocomplete?: boolean; // Hint to providers
}

/** Represents a single autocomplete suggestion. */
export interface AutocompleteMatch {
  providerName: string; // Name of the provider that generated this match
  relevance: number; // Score indicating importance (higher is better)
  contents: string; // Text displayed in the main line of the suggestion
  description?: string; // Text displayed in the second line (optional)
  destinationUrl: string; // The URL to navigate to or the search query URL
  type:
    | "history-url"
    | "history-query"
    | "bookmark"
    | "search-query"
    | "search-navigate"
    | "shortcut"
    | "zero-suggest"
    | "open-tab"
    | "pedal"
    | "clipboard"
    | "verbatim";
  isDefault?: boolean; // Hint if this could be the default action on Enter
  inlineCompletion?: string; // Text suggested for inline completion in the omnibox
  pedalAction?: string; // Identifier for a specific browser action (for Pedals)
}

/** Interface for components that generate autocomplete suggestions. */
export interface AutocompleteProvider {
  name: string;
  /**
   * Starts generating suggestions for the given input.
   * Results are sent asynchronously via the onResults callback.
   */
  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void;
  /**
   * Stops any ongoing asynchronous operations for the current query.
   */
  stop(): void;
}

/** Callback function type for notifying the UI/consumer about updated suggestions. */
export type OmniboxUpdateCallback = (results: AutocompleteMatch[]) => void;

// ========= Data Simulation =========
// Simulating data stores mentioned in the summary

interface HistoryEntry {
  id: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number; // How often typed directly
  lastVisitTime: number; // Timestamp
}

interface BookmarkEntry {
  id: number;
  url: string;
  title: string;
}

interface ShortcutEntry {
  text: string; // Input text that triggered this shortcut
  destinationUrl: string;
  score: number; // Learned relevance, decays over time (simplified)
}

interface OpenTabEntry {
  id: number;
  url: string;
  title: string;
}

// Sample data (replace with actual data loading/fetching in a real app)
const MOCK_HISTORY: HistoryEntry[] = [
  {
    id: 1,
    url: "https://www.google.com/",
    title: "Google",
    visitCount: 100,
    typedCount: 20,
    lastVisitTime: Date.now() - 86400000 * 1
  },
  {
    id: 2,
    url: "https://github.com/",
    title: "GitHub",
    visitCount: 50,
    typedCount: 10,
    lastVisitTime: Date.now() - 86400000 * 2
  },
  {
    id: 3,
    url: "https://stackoverflow.com/questions",
    title: "Stack Overflow - Questions",
    visitCount: 80,
    typedCount: 5,
    lastVisitTime: Date.now() - 3600000 * 5
  },
  {
    id: 4,
    url: "https://developer.mozilla.org/en-US/",
    title: "MDN Web Docs",
    visitCount: 30,
    typedCount: 2,
    lastVisitTime: Date.now() - 86400000 * 7
  },
  {
    id: 5,
    url: "http://localhost:3000/",
    title: "Local Dev Server",
    visitCount: 200,
    typedCount: 50,
    lastVisitTime: Date.now() - 3600000 * 1
  },
  {
    id: 6,
    url: "https://news.ycombinator.com/",
    title: "Hacker News",
    visitCount: 60,
    typedCount: 8,
    lastVisitTime: Date.now() - 86400000 * 3
  }
];

const MOCK_BOOKMARKS: BookmarkEntry[] = [
  { id: 101, url: "https://www.typescriptlang.org/docs/", title: "TypeScript Documentation" },
  { id: 102, url: "https://react.dev/", title: "React Documentation" },
  { id: 103, url: "https://github.com/features/copilot", title: "GitHub Copilot Features" }
];

// Simulate the ShortcutsDatabase
const MOCK_SHORTCUTS = new Map<string, ShortcutEntry>([
  ["news", { text: "news", destinationUrl: "https://news.ycombinator.com/", score: 1400 }], // Learned shortcut
  ["ts docs", { text: "ts docs", destinationUrl: "https://www.typescriptlang.org/docs/", score: 1300 }]
]);

const MOCK_OPEN_TABS: OpenTabEntry[] = [
  {
    id: 201,
    url: "https://www.google.com/search?q=omnibox+architecture",
    title: "omnibox architecture - Google Search"
  },
  { id: 202, url: "https://www.reddit.com/", title: "Reddit" }
];

const MOCK_PEDALS = [
  {
    triggers: ["clear history", "delete history", "clear Browse data"],
    action: "clear_Browse_data",
    description: "Clear Browse data - Chrome action"
  },
  {
    triggers: ["update chrome", "chrome update"],
    action: "update_chrome",
    description: "Update Google Chrome - Chrome action"
  },
  {
    triggers: ["incognito", "new incognito window"],
    action: "open_incognito_window",
    description: "Open Incognito window - Chrome action"
  }
];

// ========= AutocompleteResult Class =========

/** Aggregates, sorts, and deduplicates matches from various providers. */
class AutocompleteResult {
  private matches: AutocompleteMatch[] = [];
  private static MAX_RESULTS = 8; // Default limit for suggestions shown

  addMatch(match: AutocompleteMatch): void {
    this.matches.push(match);
  }

  addMatches(newMatches: AutocompleteMatch[]): void {
    this.matches.push(...newMatches);
  }

  clear(): void {
    this.matches = [];
  }

  // Simple deduplication: prioritize higher relevance for the same destinationUrl
  deduplicate(): void {
    const uniqueMatches = new Map<string, AutocompleteMatch>();
    // Sort first to process higher relevance scores first
    this.matches.sort((a, b) => b.relevance - a.relevance);

    for (const match of this.matches) {
      const key = match.destinationUrl; // Use destination URL as the primary key
      if (!uniqueMatches.has(key)) {
        uniqueMatches.set(key, match);
      }
      // If a duplicate exists but the current one is a different type we might want to keep it?
      // The summary mentions merging, e.g. bookmark + history. This simple dedupe replaces.
      // A more complex logic could merge properties or keep both if types differ significantly.
    }
    this.matches = Array.from(uniqueMatches.values());
  }

  sort(): void {
    // Primary sort by relevance (descending)
    this.matches.sort((a, b) => {
      if (b.relevance !== a.relevance) {
        return b.relevance - a.relevance;
      }
      // Add secondary sort criteria if needed (e.g., provider type, alphabetical)
      return 0;
    });
  }

  getTopMatches(limit: number = AutocompleteResult.MAX_RESULTS): AutocompleteMatch[] {
    return this.matches.slice(0, limit);
  }
}

// ========= Autocomplete Providers (Simulated) =========

abstract class BaseProvider implements AutocompleteProvider {
  abstract name: string;
  protected currentTimeout: NodeJS.Timeout | null | undefined = null;

  abstract start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void;

  stop(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
      // console.log(`${this.name}: Stopped`);
    }
  }

  protected simulateAsync(callback: () => void, delay: number): void {
    this.stop(); // Cancel previous operation if any
    this.currentTimeout = setTimeout(() => {
      this.currentTimeout = null;
      try {
        callback();
      } catch (error) {
        console.error(`Error in ${this.name} provider:`, error);
      }
    }, delay);
  }
}

class HistoryURLProvider extends BaseProvider {
  name = "HistoryURLProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Simulate background thread query (slightly delayed)
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      for (const entry of MOCK_HISTORY) {
        const urlLower = entry.url.toLowerCase();
        const matchPos = urlLower.indexOf(inputText);

        // Prioritize prefix matches, especially for typed URLs
        if (
          matchPos === 0 ||
          urlLower.startsWith("http://" + inputText) ||
          urlLower.startsWith("https://" + inputText)
        ) {
          // Simple scoring based on summary: typed count matters, prefix is good
          let relevance = 1000 + entry.typedCount * 10 + entry.visitCount;
          // Boost exact matches significantly for inline autocompletion
          if (urlLower === inputText || urlLower === "http://" + inputText || urlLower === "https://" + inputText) {
            relevance += 400; // Make it very high (~1400+ range)
          } else {
            relevance = Math.min(relevance, 1450); // Cap typical suggestions
          }

          results.push({
            providerName: this.name,
            relevance: relevance,
            contents: entry.url, // Display URL
            description: entry.title, // Display title
            destinationUrl: entry.url,
            type: "history-url",
            // Offer inline completion for strong prefix matches
            inlineCompletion: matchPos === 0 && entry.url.length > inputText.length ? entry.url : undefined,
            isDefault: relevance > 1400 // Good candidate for default if score is very high
          });
        }
      }
      // Sort locally by relevance before sending back (providers might do this)
      results.sort((a, b) => b.relevance - a.relevance);
      onResults(results);
    }, 50); // Simulate history thread lookup time
  }
}

class HistoryQuickProvider extends BaseProvider {
  name = "HistoryQuickProvider (HQP)";
  // Simulating the In-Memory URL Index (IMUI) by just filtering the main list quickly
  // A real implementation would use complex tokenization and indexing structures.

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase();
    if (inputText.length < 2) {
      // Often HQP needs a bit more input
      onResults([]);
      return;
    }

    // Simulate very fast in-memory lookup
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      // Filter "significant" history (e.g., typed, recent, frequent - simplified here)
      const significantHistory = MOCK_HISTORY.filter(
        (e) => e.typedCount > 0 || e.visitCount > 10 || Date.now() - e.lastVisitTime < 86400000 * 3
      ); // last 3 days

      for (const entry of significantHistory) {
        const urlLower = entry.url.toLowerCase();
        const titleLower = entry.title.toLowerCase();
        const terms = inputText.split(" ").filter((t) => t); // Basic tokenization

        // Check if all terms appear anywhere in URL or title (simulating index lookup)
        const matchFound = terms.every((term) => urlLower.includes(term) || titleLower.includes(term));

        if (matchFound) {
          // Scoring based on summary: recency, frequency, match quality (simplified)
          // Higher base score than search, lower than strong HistoryURL prefix match
          let relevance = 800;
          relevance += entry.typedCount * 5 + Math.floor(entry.visitCount / 2);
          if (Date.now() - entry.lastVisitTime < 86400000) relevance += 100; // Recency bonus
          // Bonus if match is at start of word/title/URL (simplified)
          if (terms.some((term) => titleLower.startsWith(term) || urlLower.includes("//" + term))) {
            relevance += 150;
          }

          results.push({
            providerName: this.name,
            relevance: Math.min(relevance, 1250), // HQP scores below top URL matches usually
            contents: entry.url,
            description: entry.title,
            destinationUrl: entry.url,
            type: "history-url" // Can suggest URLs
          });
        }
      }
      results.sort((a, b) => b.relevance - a.relevance);
      onResults(results.slice(0, 3)); // HQP often returns limited (e.g., 3) high-quality results
    }, 20); // Designed to be very fast (~20ms)
  }
}

class BookmarkProvider extends BaseProvider {
  name = "BookmarkProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Simulate fast in-memory bookmark model search
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      for (const entry of MOCK_BOOKMARKS) {
        const urlLower = entry.url.toLowerCase();
        const titleLower = entry.title.toLowerCase();

        // Match prefix or keywords in title or URL
        if (titleLower.includes(inputText) || urlLower.includes(inputText)) {
          // Base relevance around 900, boost for title match
          let relevance = 850;
          if (titleLower.startsWith(inputText)) {
            relevance = 950;
          } else if (titleLower.includes(inputText)) {
            relevance = 900;
          }

          results.push({
            providerName: this.name,
            relevance: relevance,
            contents: entry.title, // Display title prominently
            description: entry.url, // Show URL as description
            destinationUrl: entry.url,
            type: "bookmark"
          });
        }
      }
      results.sort((a, b) => b.relevance - a.relevance);
      onResults(results);
    }, 30); // Bookmarks are usually fast
  }
}

class ShortcutsProvider extends BaseProvider {
  name = "ShortcutsProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Simulate fast SQLite lookup
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      // Find shortcuts matching the *exact* input text prefix
      for (const [text, shortcut] of MOCK_SHORTCUTS.entries()) {
        if (text.startsWith(inputText)) {
          results.push({
            providerName: this.name,
            // Use stored score, potentially very high for learned habits
            relevance: shortcut.score,
            contents: shortcut.destinationUrl, // Often shows the URL
            description: `Shortcut for "${shortcut.text}"`, // Clarify origin
            destinationUrl: shortcut.destinationUrl,
            type: "shortcut",
            isDefault: shortcut.score > 1300 // High-scoring shortcuts can be default
          });
        }
      }
      results.sort((a, b) => b.relevance - a.relevance);
      onResults(results);
    }, 15); // Shortcut lookup should be extremely fast
  }
}

class SearchProvider extends BaseProvider {
  name = "SearchProvider";
  private defaultSearchUrl = "https://www.google.com/search?q="; // Example

  // Simulate fetching suggestions from Google Suggest API
  private async fetchSuggestions(query: string): Promise<string[]> {
    console.log(`Simulating network request to Suggest API for: "${query}"`);
    // Actual implementation uses fetch/XMLHttpRequest
    return new Promise((resolve) => {
      // Simulate network latency
      const delay = 50 + Math.random() * 100; // 50-150ms
      this.currentTimeout = setTimeout(() => {
        // Mock responses based on query
        if (query === "face") {
          resolve(["facebook", "facebook login", "facetune"]);
        } else if (query === "typescript") {
          resolve(["typescript tutorial", "typescript documentation", "typescript react"]);
        } else if (query.startsWith("weather")) {
          resolve(["weather in london", "weather forecast"]); // Simulate weather suggestions
        } else if (query.length > 1) {
          resolve([`${query} examples`, `${query} tutorial`, `what is ${query}`]);
        } else {
          resolve([]);
        }
      }, delay);
    });
  }

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text;
    if (!inputText || inputText.includes("://") || inputText.startsWith("localhost")) {
      // Don't fetch suggestions for URLs or very short inputs sometimes
      onResults([]);
      return;
    }

    // Add the verbatim search immediately
    const verbatimMatch: AutocompleteMatch = {
      providerName: this.name,
      relevance: 1300, // High score to appear near top, but below strong nav
      contents: inputText,
      description: `Search for "${inputText}"`, // Or search engine name
      destinationUrl: `${this.defaultSearchUrl}${encodeURIComponent(inputText)}`,
      type: "verbatim", // Special type for clarity, often treated as search
      isDefault: true // Usually the fallback default action
    };
    onResults([verbatimMatch]); // Send verbatim immediately

    // Fetch remote suggestions asynchronously
    this.fetchSuggestions(inputText)
      .then((suggestions) => {
        // Check if timeout was cleared (request cancelled by stop())
        if (this.currentTimeout === undefined) {
          // Check if stop was called
          return;
        }
        const results: AutocompleteMatch[] = [];
        suggestions.forEach((suggestion, index) => {
          // Base relevance around 600-800, first suggestion is usually highest
          const relevance = 800 - index * 50;
          // Check if suggestion looks like a URL (navigational suggestion)
          let type: AutocompleteMatch["type"] = "search-query";
          let destinationUrl = `${this.defaultSearchUrl}${encodeURIComponent(suggestion)}`;
          if (suggestion.includes(".") && !suggestion.includes(" ")) {
            // Basic check for URL-like suggestion
            type = "search-navigate";
            destinationUrl = suggestion.startsWith("http") ? suggestion : `http://${suggestion}`;
            // Potentially boost score for navigational suggestions? Text doesn't explicitly state boost here.
          }

          results.push({
            providerName: this.name,
            relevance: relevance,
            contents: suggestion,
            destinationUrl: destinationUrl,
            type: type
          });
        });
        onResults(results); // Send network results when they arrive
      })
      .catch((error) => {
        console.error("Search Suggestion Error:", error);
        onResults([]); // Send empty results on error
      });
  }

  // Override stop to clear the pending promise simulation
  stop(): void {
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = undefined; // Mark as stopped
      // console.log(`${this.name}: Stopped`);
    }
  }
}

class ZeroSuggestProvider extends BaseProvider {
  name = "ZeroSuggestProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    // Only runs on focus with empty input
    if (input.type !== "focus" || input.text !== "") {
      onResults([]);
      return;
    }

    // Simulate fetching server suggestions or using local most visited
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      // Example: Suggest top 2 most visited sites from history
      const mostVisited = [...MOCK_HISTORY].sort((a, b) => b.visitCount - a.visitCount).slice(0, 2);
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
      // Could also add "trending searches" from a simulated server call here
      console.log("ZeroSuggestProvider returning:", results);
      onResults(results);
    }, 80); // Simulate potential network call or local calculation
  }
}

class OpenTabProvider extends BaseProvider {
  name = "OpenTabProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase();
    if (inputText.length < 3) {
      // Don't suggest for very short input
      onResults([]);
      return;
    }

    // Simulate searching open tabs (should be fast)
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      for (const tab of MOCK_OPEN_TABS) {
        if (tab.title.toLowerCase().includes(inputText) || tab.url.toLowerCase().includes(inputText)) {
          results.push({
            providerName: this.name,
            relevance: 1500, // High relevance to encourage switching tabs
            contents: tab.title,
            description: `Switch to this tab - ${tab.url}`,
            // Destination URL might be special internal command like chrome://switch-tab/id
            destinationUrl: `chrome://switch-tab/${tab.id}`,
            type: "open-tab",
            isDefault: true // Often becomes the default action if matched
          });
        }
      }
      onResults(results);
    }, 25);
  }
}

class OmniboxPedalProvider extends BaseProvider {
  name = "OmniboxPedalProvider";

  start(input: AutocompleteInput, onResults: (matches: AutocompleteMatch[]) => void): void {
    const inputText = input.text.toLowerCase().trim();
    if (!inputText) {
      onResults([]);
      return;
    }

    // Simulate client-side matching against known triggers
    this.simulateAsync(() => {
      const results: AutocompleteMatch[] = [];
      for (const pedal of MOCK_PEDALS) {
        if (pedal.triggers.some((trigger) => inputText === trigger || inputText.startsWith(trigger + " "))) {
          results.push({
            providerName: this.name,
            relevance: 1600, // Very high relevance for direct actions
            contents: pedal.description, // Display the action text
            // Destination URL could be an internal settings page or command
            destinationUrl: `chrome://action/${pedal.action}`,
            type: "pedal",
            pedalAction: pedal.action, // Include the action identifier
            isDefault: true // Pedals are often default if triggered
          });
          // Typically only one pedal is shown at a time
          break;
        }
      }
      onResults(results);
    }, 10); // Pedal matching is very fast
  }
}

// ========= AutocompleteController =========

/** Orchestrates suggestion generation from multiple providers. */
class AutocompleteController {
  private providers: AutocompleteProvider[];
  private currentResult: AutocompleteResult = new AutocompleteResult();
  private onUpdate: OmniboxUpdateCallback;
  private activeProviders: number = 0;
  public currentInput: AutocompleteInput | null = null;

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

    // Define regex patterns to detect potential URLs more robustly
    const urlPatterns = [
      /^([a-z][a-z0-9+\-.]*:)\/\/.*$/i, // Protocol like http://, ftp://, etc.
      /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9](:[0-9]+)?(\/.*)?$/i, // Domain names like google.com, with optional port/path
      /^localhost(:[0-9]+)?(\/.*)?$/i, // localhost with optional port/path
      /^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}(:[0-9]+)?(\/.*)?$/ // IPv4 address with optional port/path
      // Add more specific patterns if needed
    ];

    // Check if the input text matches any of the URL patterns
    const isLikelyUrl = urlPatterns.some((pattern) => pattern.test(input.text));

    // Add verbatim search fallback *only* if text exists and it's NOT likely a URL.
    // The main SearchProvider will still handle its own verbatim/navigational logic.
    if (input.text) {
      if (isLikelyUrl) {
        const urlVerbatimSearch: AutocompleteMatch = {
          providerName: "ControllerFallback",
          relevance: 1300, // Default verbatim score
          contents: input.text,
          description: `Search for "${input.text}"`,
          destinationUrl: input.text,
          type: "verbatim",
          isDefault: true
        };
        this.currentResult.addMatch(urlVerbatimSearch);
      }

      const verbatimSearch: AutocompleteMatch = {
        providerName: "ControllerFallback",
        relevance: 1300, // Default verbatim score
        contents: input.text,
        description: `Search for "${input.text}"`,
        destinationUrl: `https://www.google.com/search?q=${encodeURIComponent(input.text)}`, // Use default engine
        type: "verbatim",
        isDefault: true
      };
      this.currentResult.addMatch(verbatimSearch);
    }

    // Special handling for ZeroSuggest on focus
    if (input.type === "focus" && input.text === "") {
      const zeroSuggestProvider = this.providers.find((p) => p instanceof ZeroSuggestProvider);
      if (zeroSuggestProvider) {
        this.activeProviders++;
        // Bind `this` to ensure correct context in the callback
        zeroSuggestProvider.start(input, this.onProviderResults.bind(this, zeroSuggestProvider));
      }
    } else {
      // Start all relevant providers for non-focus/non-empty input
      this.providers.forEach((provider) => {
        // Don't run ZeroSuggestProvider on normal input
        if (provider instanceof ZeroSuggestProvider) return;

        // Maybe add more logic here: e.g., disable search provider if offline?
        this.activeProviders++;
        // Bind `this` to ensure correct context in the callback
        provider.start(input, this.onProviderResults.bind(this, provider));
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
  private onProviderResults(provider: AutocompleteProvider, matches: AutocompleteMatch[]): void {
    // Ignore results if the query has already been stopped or input changed
    // (Simplified check; a real system might use query IDs)
    if (this.activeProviders === 0) {
      // console.log(`AutocompleteController: Ignoring stale results from ${provider.name}`);
      return;
    }

    console.log(`AutocompleteController: Received ${matches.length} results from ${provider.name}`);
    this.currentResult.addMatches(matches);
    this.activeProviders--;

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

// ========= Main Omnibox Class (Public API) =========

export class Omnibox {
  private controller: AutocompleteController;
  private lastInputText: string = ""; // Track input to manage focus vs keystroke

  constructor(onUpdate: OmniboxUpdateCallback) {
    // Instantiate providers based on the summary
    const providers: AutocompleteProvider[] = [
      new HistoryURLProvider(),
      new HistoryQuickProvider(), // Fast history search
      new SearchProvider(), // Includes verbatim search + network suggestions
      new BookmarkProvider(),
      new ShortcutsProvider(), // Learned user shortcuts
      new ZeroSuggestProvider(), // For suggestions on focus
      new OpenTabProvider(), // Suggests switching to open tabs
      new OmniboxPedalProvider() // Browser actions like "clear history"
      // Add other providers like ClipboardProvider if needed
    ];

    this.controller = new AutocompleteController(providers, onUpdate);
  }

  /**
   * Call this when the user types in the Omnibox or focuses it.
   * @param text The current text in the Omnibox input field.
   * @param eventType Indicates if this was triggered by focusing the input or typing.
   */
  public handleInput(text: string, eventType: "focus" | "keystroke"): void {
    const input: AutocompleteInput = {
      text: text,
      type: eventType
      // currentURL: // Could get the current tab's URL if needed
    };

    // Basic logic to differentiate initial focus from subsequent keystrokes
    if (eventType === "focus" && text === this.lastInputText) {
      // If focused and text hasn't changed (e.g., clicking back into the bar)
      // Re-trigger with 'focus' type, especially important for ZeroSuggest
      this.controller.start(input);
    } else if (text !== this.lastInputText || eventType === "focus") {
      // If text changed OR it's a focus event (even with same text initially)
      this.controller.start(input);
    }
    // Else: Keystroke didn't change text (e.g., arrow keys) - do nothing for now

    this.lastInputText = text;
  }

  /** Call this when the Omnibox is blurred or closed to clean up. */
  public stopQuery(): void {
    this.controller.stop();
    this.lastInputText = ""; // Reset last input on stop
  }
}

// ========= Example Usage =========

/*
// How you might use this in a hypothetical frontend/browser context:

// 1. Define a callback function to handle UI updates
const displaySuggestions = (matches: AutocompleteMatch[]) => {
    console.log("--- Omnibox Suggestions Update ---");
    if (matches.length === 0) {
        console.log("(No suggestions)");
    } else {
        matches.forEach((match, index) => {
            console.log(
                `${index + 1}. [${match.providerName} (${match.relevance})] ${match.contents}` +
                (match.description ? ` - ${match.description}` : '') +
                ` -> ${match.destinationUrl}` +
                (match.inlineCompletion ? ` [Inline: ${match.inlineCompletion}]` : '') +
                 (match.pedalAction ? ` [Action: ${match.pedalAction}]` : '')
            );
        });
    }
    console.log("---------------------------------");
    // Code to update the actual dropdown UI would go here
};

// 2. Create an instance of the Omnibox backend
const omniboxBackend = new Omnibox(displaySuggestions);

// 3. Simulate user interactions

console.log("Simulating Focus on Empty Omnibox:");
omniboxBackend.handleInput("", 'focus');

// Wait a bit for async operations like ZeroSuggest
setTimeout(() => {
    console.log("\nSimulating typing 'news':");
    omniboxBackend.handleInput("news", 'keystroke');
}, 300);

setTimeout(() => {
    console.log("\nSimulating typing 'typescript':");
    omniboxBackend.handleInput("typescript", 'keystroke');
}, 800); // Allow time for 'news' results


setTimeout(() => {
    console.log("\nSimulating typing 'clear history':");
    omniboxBackend.handleInput("clear history", 'keystroke');
}, 1500);

setTimeout(() => {
    console.log("\nSimulating typing 'http://localh':");
     omniboxBackend.handleInput("http://localh", 'keystroke');
}, 2000);


setTimeout(() => {
    console.log("\nSimulating Omnibox blur/close:");
    omniboxBackend.stopQuery();
}, 3000);

*/

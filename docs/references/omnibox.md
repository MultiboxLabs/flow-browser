# Omnibox Backend Documentation

## Overview

This document describes the TypeScript implementation of the Omnibox backend system used in this application. It is responsible for handling user input in the omnibox (address/search bar), fetching suggestions from various sources asynchronously, ranking them, and providing the results for display.

The system aims to provide relevant suggestions including search queries, browsing history, open tabs, and zero-input suggestions when the omnibox is focused.

## Core Concepts

The implementation revolves around several key components:

1.  **`Omnibox` Class:** The main public interface. It initializes providers, receives input events (`focus`, `keystroke`), manages the query lifecycle (`start`, `stop`), handles the selection of a match (`openMatch`), and communicates results via a callback.
2.  **`AutocompleteController`:** Orchestrates the suggestion generation process. It manages a list of `AutocompleteProvider` instances, starts/stops queries for specific inputs, aggregates results using `AutocompleteResult`, handles asynchronous provider responses, deduplicates/sorts matches, and triggers updates via the `Omnibox` callback. It uses unique request IDs (`generateUUID`) to handle concurrent requests correctly.
3.  **`AutocompleteProvider` Interface & `BaseProvider` Class:** Defines the contract for suggestion generators. Each provider is responsible for fetching suggestions from a specific source (e.g., history, search engine). `BaseProvider` is an abstract class implementing the interface. Providers operate asynchronously.
4.  **`AutocompleteMatch` Interface:** Represents a single suggestion item, containing its text (`contents`, `description`), destination URL or action identifier (`destinationUrl`), relevance score, suggestion type, and originating provider name.
5.  **`AutocompleteResult` Class:** An internal helper class used by `AutocompleteController` to collect, deduplicate (based on `destinationUrl`), sort (by relevance), and limit the number of matches from all providers for a single query.
6.  **Asynchronous Operations:** Providers fetch data asynchronously (e.g., using `Promise`s for history, tabs, search suggestions). The `AutocompleteController` manages these concurrent operations.
7.  **Relevance Scoring & Ranking:** Providers assign relevance scores (integers, higher is better) based on heuristics. The `AutocompleteController` uses these scores to sort the final suggestion list via `AutocompleteResult`.

## Setup

To integrate the Omnibox backend, import the necessary components:

```typescript
import { Omnibox, OmniboxUpdateCallback } from "@/lib/omnibox/omnibox";
import { AutocompleteMatch } from "@/lib/omnibox/types";

// Assuming you have a way to handle UI updates and actions
const handleSuggestionsUpdate: OmniboxUpdateCallback = (matches: AutocompleteMatch[], continuous?: boolean) => {
  // Update UI dropdown with new matches
  console.log("Updated Suggestions:", matches);
};

const omniboxBackend = new Omnibox(handleSuggestionsUpdate);

// Connect omniboxBackend.handleInput to your input field's events
// Connect omniboxBackend.openMatch to your suggestion selection logic
```

## Usage

1.  **Instantiate `Omnibox`:** Create an instance, passing a callback function that receives updated suggestions.
2.  **Handle User Input:** Call `handleInput(text, eventType)` when the user types or focuses the omnibox.
    - `text`: The current text in the input field.
    - `eventType`: `'focus'` or `'keystroke'`.
      The `handleSuggestionsUpdate` callback will be invoked as results become available.
3.  **Handle Match Selection:** Call `openMatch(match)` when the user selects a suggestion. The `Omnibox` class will determine the appropriate action (e.g., navigate to URL, switch tab).
4.  **Stop Query:** Call `stopQuery()` when the omnibox is blurred or closed to cancel pending operations.

```typescript
// Example: Focus event
omniboxBackend.handleInput("", "focus");

// Example: Keystroke event
omniboxBackend.handleInput("flow", "keystroke");

// Example: Selecting a match
const selectedMatch: AutocompleteMatch = /* ... get match from UI */;
omniboxBackend.openMatch(selectedMatch);

// Example: Blurring the input
omniboxBackend.stopQuery();
```

## API Reference

### `Omnibox` Class (`vite/src/lib/omnibox/omnibox.ts`)

- **`constructor(onUpdate: OmniboxUpdateCallback)`**
  - Initializes the `AutocompleteController` with a set of providers (`ZeroSuggestProvider`, `SearchProvider`, `HistoryURLProvider`, `OpenTabProvider`).
- **`handleInput(text: string, eventType: 'focus' | 'keystroke')`**
  - Creates an `AutocompleteInput` object.
  - Calls `controller.start()` to initiate suggestion fetching based on the input text and event type. Differentiates between focus events and keystrokes.
- **`stopQuery()`**
  - Calls `controller.stop()` to cancel ongoing provider operations and resets internal state.
- **`openMatch(autocompleteMatch: AutocompleteMatch)`**
  - Takes an `AutocompleteMatch` selected by the user.
  - If `type` is `'open-tab'`, it parses the `destinationUrl` (`spaceId:tabId`) and logs the intent to switch tabs (TODO: Implement tab switching).
  - Otherwise, it assumes the `destinationUrl` is a URL and logs the intent to open it (TODO: Implement URL opening).

### `OmniboxUpdateCallback` Type (`vite/src/lib/omnibox/omnibox.ts`)

- **`type OmniboxUpdateCallback = (results: AutocompleteMatch[], continuous?: boolean) => void;`**
  - `results`: An array of `AutocompleteMatch` objects, sorted by relevance.
  - `continuous?`: An optional boolean indicating if more results from the same query are expected from other providers.

### `AutocompleteInput` Interface (`vite/src/lib/omnibox/types.ts`)

- Represents the input state for a query.
  - `text: string`: The user's typed text.
  - `currentURL?: string`: (Optional) The URL of the current page (not currently used).
  - `type: 'focus' | 'keystroke'`: The event that triggered the query.
  - `preventInlineAutocomplete?: boolean`: (Optional) Hint for providers (not currently used).

### `AutocompleteMatch` Interface (`vite/src/lib/omnibox/types.ts`)

- Represents a single suggestion item.
  - `providerName: string`: Name of the originating provider.
  - `relevance: number`: Score indicating importance (higher is better).
  - `contents: string`: Primary text displayed.
  - `description?: string`: Secondary text (optional).
  - `destinationUrl: string`: The URL to navigate to, the search query URL, or an identifier like `spaceId:tabId`.
  - `type: "history-url" | "zero-suggest" | "verbatim" | "url-what-you-typed" | "search-query" | "open-tab"`: The type of suggestion.
  - `isDefault?: boolean`: Hint if this could be the default action on Enter.
  - `inlineCompletion?: string`: Text suggested for inline completion (optional, used by `HistoryURLProvider`).
  - `pedalAction?: string`: Identifier for a browser action (optional, not currently implemented).

### `AutocompleteProvider` Interface (`vite/src/lib/omnibox/base-provider.tsx`)

- **`name: string`**: Identifier for the provider.
- **`start(input: AutocompleteInput, onResults: OmniboxUpdateCallback): void`**: Starts generating suggestions. Results are sent via `onResults`.
- **`stop(): void`**: Stops any ongoing asynchronous operations.

### `BaseProvider` Class (`vite/src/lib/omnibox/base-provider.tsx`)

- Abstract class implementing `AutocompleteProvider`. Concrete providers extend this.

### `AutocompleteResult` Class (`vite/src/lib/omnibox/autocomplete-result.ts`)

- Manages a collection of `AutocompleteMatch`es for a single query.
- **`addMatch(match: AutocompleteMatch)` / `addMatches(newMatches: AutocompleteMatch[])`**: Adds matches.
- **`clear()`**: Resets the internal matches array.
- **`deduplicate()`**: Removes matches with duplicate `destinationUrl`, keeping the one with the highest relevance. Sorts by relevance beforehand.
- **`sort()`**: Sorts matches primarily by relevance (descending).
- **`getTopMatches(limit?: number)`**: Returns the top matches, up to a specified limit (default 8).

### `AutocompleteController` Class (`vite/src/lib/omnibox/autocomplete-controller.ts`)

- Orchestrates the entire suggestion process.
- **`constructor(providers: AutocompleteProvider[], onUpdate: OmniboxUpdateCallback)`**: Stores providers and the update callback.
- **`start(input: AutocompleteInput)`**: Stops previous query, clears results, generates a new request ID, and starts relevant providers. Handles the special case for `ZeroSuggestProvider` on empty focus events. Calls `updateResults` initially.
- **`stop()`**: Calls `stop()` on all active providers.
- **`onProviderResults(...)`**: Callback for providers. Checks request ID, adds matches to `currentResult`, decrements active provider count (if not continuous), and calls `updateResults`.
- **`updateResults()`**: Calls `deduplicate()` and `sort()` on `currentResult`, then invokes the main `onUpdate` callback with the top matches.

## Implemented Providers

The following providers are currently implemented and used:

- **`ZeroSuggestProvider` (`vite/src/lib/omnibox/providers/zero-suggest.ts`)**
  - Runs only when the omnibox receives focus (`type: 'focus'`) and is empty (`text: ""`).
  - Fetches recently open tabs (`getOpenTabsInSpace`) and most visited history entries (`getHistory`).
  - Generates suggestions with types `'open-tab'` and `'zero-suggest'`.
- **`SearchProvider` (`vite/src/lib/omnibox/providers/search.ts`)**
  - Runs for non-empty inputs (`type: 'keystroke'` or non-empty `focus`).
  - Immediately provides a "verbatim" search suggestion (`type: 'verbatim'`) if the input doesn't look like a URL.
  - Fetches search suggestions from the configured search engine (`getSearchSuggestions`). Uses an `AbortController` to cancel requests if a new query starts.
  - Generates suggestions with type `'search-query'`.
- **`HistoryURLProvider` (`vite/src/lib/omnibox/providers/history-url.ts`)**
  - Runs for non-empty inputs.
  - Checks if the input is a valid URL (`getURLFromInput`) and immediately provides a `type: 'url-what-you-typed'` suggestion if so.
  - Fetches browsing history (`getHistory`).
  - Searches history entries for matches in the URL or title against the input text.
  - Assigns relevance based on factors like typed count, visit count, and whether it's an exact match.
  - Generates suggestions with type `'history-url'`, potentially including `inlineCompletion`.
- **`OpenTabProvider` (`vite/src/lib/omnibox/providers/open-tabs.ts`)**
  - Runs for non-empty inputs (minimum 3 characters).
  - Fetches currently open tabs in the current space (`getOpenTabsInSpace`).
  - Searches tab titles and URLs for the input text.
  - Generates suggestions with `type: 'open-tab'` and a high relevance score, using `spaceId:tabId` as the `destinationUrl`.

## Architecture & Data Flow

1.  User interaction (`focus` or `keystroke`) triggers `Omnibox.handleInput`.
2.  `Omnibox` creates an `AutocompleteInput` and calls `AutocompleteController.start`.
3.  `AutocompleteController` stops any previous query, clears results, generates a request ID.
4.  If `input.type` is `focus` and `input.text` is empty, only `ZeroSuggestProvider` is started.
5.  Otherwise, `SearchProvider`, `HistoryURLProvider`, and `OpenTabProvider` are started concurrently. `SearchProvider` might immediately return a verbatim match. `HistoryURLProvider` might immediately return a URL match.
6.  Each active provider fetches its data asynchronously (e.g., `getHistory()`, `getSearchSuggestions()`, `getOpenTabsInSpace()`).
7.  As each provider gets results, it calls the `onProviderResults` callback provided by the `AutocompleteController`, passing the results and the original request ID.
8.  `AutocompleteController.onProviderResults` checks if the request ID matches the current one. If so, it adds the new matches to its `AutocompleteResult` instance.
9.  It decrements the active provider count (unless the provider indicated `continuous`).
10. `AutocompleteController.updateResults` is called:
    a. `AutocompleteResult.deduplicate()` removes lower-relevance duplicates based on `destinationUrl`.
    b. `AutocompleteResult.sort()` sorts all current matches by relevance.
    c. The main `onUpdate` callback (passed to `Omnibox` constructor) is invoked with the sorted, deduplicated, and limited list of top matches.
11. The UI receives the updated list and redraws the suggestion dropdown.
12. Steps 7-11 repeat as more providers return results for the same query.
13. When the omnibox is closed or blurred, `Omnibox.stopQuery` calls `AutocompleteController.stop`, which cancels pending operations in providers (like the `SearchProvider`'s network request).

## Limitations

- **Data Source Scope:** The suggestions are limited by the data returned by `getHistory`, `getOpenTabsInSpace`, and `getSearchSuggestions`. The completeness and accuracy depend on these underlying functions.
- **Ranking Simplicity:** Relevance scoring is based on simple heuristics within each provider. There is no complex cross-provider scoring or Machine Learning model as found in browsers like Chrome.
- **Deduplication Logic:** Deduplication is solely based on `destinationUrl`, keeping the highest relevance score. More sophisticated merging strategies (e.g., combining metadata from different sources for the same URL) are not implemented.
- **Action Implementation:** The `openMatch` method currently only logs the intended action (opening URL or switching tab). The actual browser navigation/tab management logic needs to be implemented externally.
- **No Persistence:** Learned associations or shortcut features are not implemented.

## Customization

- **Modify Providers:** Adjust the logic, data fetching, or relevance scoring within existing provider classes.
- **Add New Providers:** Create new classes implementing `AutocompleteProvider` (extending `BaseProvider` is recommended) and add instances to the `providers` array in the `Omnibox` constructor to integrate new suggestion sources.
- **Adjust Controller Logic:** Modify `AutocompleteResult` limits, sorting, or deduplication logic if needed.
- **Implement Actions:** Flesh out the `// TODO:` sections in `Omnibox.openMatch` to perform actual navigation and tab switching based on the application's architecture.

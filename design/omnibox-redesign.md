# Omnibox Redesign: Chromium-Quality Autocomplete for Flow Browser

## 1. Current State Assessment

### What exists

The omnibox has a clean provider architecture (`AutocompleteProvider` interface, `BaseProvider` abstract class, `AutocompleteController` orchestrator, `AutocompleteResult` aggregator) with five providers:

| Provider               | Data Source           | Status                     |
| ---------------------- | --------------------- | -------------------------- |
| `SearchProvider`       | Google Suggest API    | Working (basic)            |
| `HistoryURLProvider`   | `getHistory()`        | **Broken** - returns `[]`  |
| `OpenTabProvider`      | `flow.tabs.getData()` | Working                    |
| `ZeroSuggestProvider`  | History + tabs        | **Broken** - history empty |
| `OmniboxPedalProvider` | Hardcoded actions     | Working                    |

### Critical gaps vs Chromium

| Capability              | Chromium                                                     | Flow (current)                                         |
| ----------------------- | ------------------------------------------------------------ | ------------------------------------------------------ |
| History collection      | Full visit tracking with typed/linked/redirect types         | **None** - no history DB table, no collection          |
| History index           | In-memory URL index (IMUI), sub-20ms, tokenized              | **None**                                               |
| Frecency scoring        | Exponential decay (30d half-life), visit type weighting      | **None**                                               |
| String matching         | Multi-term tokenized intersection, substring, position-aware | Dice coefficient (string-similarity-js), 0.4 threshold |
| Input classification    | URL vs search heuristics with async DNS fallback             | Basic `getURLFromInput()` regex                        |
| Inline autocompletion   | Synchronous prefix completion with strict stability          | **None**                                               |
| Bookmarks provider      | Full bookmark title/URL matching with scoring signals        | **None**                                               |
| Shortcuts provider      | Learned input-to-destination mappings with decay             | **None**                                               |
| Search suggestions      | Uses server relevance scores, navsuggestions, prefetch       | Ignores server relevance, no navsuggestions            |
| Deduplication           | URL normalization, cross-provider merge with metadata        | Simple `destinationUrl` exact match                    |
| Default match stability | Top match frozen during async updates, arrow-key freeze      | No stability guarantees                                |
| Scoring model           | 37-signal ML model with blending strategies                  | Fixed score ranges per provider                        |

## 2. Target Architecture

### 2.1 Architecture overview

```
                          User Input
                              |
                              v
                    +-------------------+
                    | InputClassifier   |  URL vs Search vs Keyword
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | AutocompleteController |
                    +-------------------+
                     /    |    |    |    \
                    v     v    v    v     v
              +------+ +-----+ +----+ +-----+ +--------+
              | HQP  | | HUP | | SP | | OTP | | Others |
              +------+ +-----+ +----+ +-----+ +--------+
              History  History  Search  OpenTab  Bookmarks,
              Quick    URL             Provider  Shortcuts,
              Provider Provider                  Pedals,
                    \     |    |    |     /       ZeroSuggest
                     v    v    v    v    v
                    +-------------------+
                    | AutocompleteResult |  Merge, dedupe, sort
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | ScoringEngine     |  Re-rank with combined signals
                    +-------------------+
                              |
                              v
                    +-------------------+
                    | UI (Dropdown +    |
                    |  Inline Complete) |
                    +-------------------+
```

### 2.2 Component responsibilities

| Component                      | Responsibility                                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| **InputClassifier**            | Determine if input is a URL, search query, keyword trigger, or ambiguous. Sets `AutocompleteInput.inputType`. |
| **AutocompleteController**     | Orchestrate providers, manage request lifecycle, enforce stability guarantees, coordinate scoring pass.       |
| **HistoryQuickProvider (HQP)** | Fast in-memory tokenized matching against significant history. Returns top 3. Sub-20ms.                       |
| **HistoryURLProvider (HUP)**   | URL-prefix and what-you-typed matching against full history DB. Handles "navigate to typed URL" case.         |
| **SearchProvider**             | Verbatim search match + Google Suggest API integration with server relevance parsing.                         |
| **OpenTabProvider**            | Match against currently open tabs in the active space.                                                        |
| **BookmarkProvider**           | Match against bookmarked URLs by title and URL.                                                               |
| **ShortcutsProvider**          | Match against learned input-to-destination shortcuts.                                                         |
| **ZeroSuggestProvider**        | On-focus suggestions from recent history, frequent sites, and open tabs.                                      |
| **OmniboxPedalProvider**       | Browser action triggers (settings, new window, etc.).                                                         |
| **AutocompleteResult**         | Merge candidates from all providers, deduplicate with URL normalization, apply final sort.                    |
| **ScoringEngine**              | Combined scoring using frecency, match quality, and contextual signals.                                       |
| **InMemoryURLIndex (IMUI)**    | Tokenized in-memory index of significant history entries for HQP.                                             |

### 2.3 Data flow

1. User types a character or focuses the omnibox.
2. `InputClassifier` analyzes the input and produces an `AutocompleteInput` with classification metadata.
3. `AutocompleteController.start(input)` cancels any previous query and fans out to providers.
4. Providers run concurrently:
   - **Sync providers** (HQP, BookmarkProvider, ShortcutsProvider, PedalProvider) return immediately.
   - **Async providers** (SearchProvider, HUP database query) return via callback.
5. On each provider callback, `AutocompleteController` merges new matches into `AutocompleteResult`.
6. `AutocompleteResult.deduplicate()` normalizes URLs and merges duplicates (keeping highest score, merging metadata).
7. `AutocompleteResult.sort()` orders by relevance, with default-match stability enforcement.
8. Results published to UI via `onUpdate` callback.
9. **Stability rule**: once the user starts arrow-navigating, async updates are suppressed until the next keystroke.

## 3. Data Model

### 3.1 History table (new)

Add to `src/main/saving/db/schema.ts`:

```typescript
export const history = sqliteTable(
  "history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    visitCount: integer("visit_count").notNull().default(1),
    typedCount: integer("typed_count").notNull().default(0),
    lastVisitTime: integer("last_visit_time").notNull(), // epoch ms
    firstVisitTime: integer("first_visit_time").notNull(), // epoch ms
    // Bitfield: 0=link, 1=typed, 2=bookmark, 3=redirect, 4=reload
    lastVisitType: integer("last_visit_type").notNull().default(0)
  },
  (table) => [
    index("idx_history_url").on(table.url),
    index("idx_history_last_visit").on(table.lastVisitTime),
    index("idx_history_typed_count").on(table.typedCount)
  ]
);
```

### 3.2 Shortcuts table (new)

```typescript
export const shortcuts = sqliteTable(
  "shortcuts",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    inputText: text("input_text").notNull(), // what the user typed
    destinationUrl: text("destination_url").notNull(),
    destinationTitle: text("destination_title").notNull().default(""),
    matchType: text("match_type").notNull(), // "history-url", "search-query", etc.
    hitCount: integer("hit_count").notNull().default(1),
    lastAccessTime: integer("last_access_time").notNull() // epoch ms
  },
  (table) => [
    index("idx_shortcuts_input").on(table.inputText),
    index("idx_shortcuts_destination").on(table.destinationUrl)
  ]
);
```

### 3.3 Bookmarks table (new)

```typescript
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    parentFolderId: integer("parent_folder_id"),
    position: integer("position").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    isFolder: integer("is_folder", { mode: "boolean" }).notNull().default(false)
  },
  (table) => [index("idx_bookmarks_url").on(table.url), index("idx_bookmarks_parent").on(table.parentFolderId)]
);
```

### 3.4 History collection

History collection happens in the **main process** by observing tab navigation events. Every completed navigation (not redirect chains, but final destinations) inserts or updates a history row:

```
on navigation-committed(tabId, url, title, isTyped):
  existing = SELECT * FROM history WHERE url = normalizeUrl(url)
  if existing:
    UPDATE history SET
      visit_count = visit_count + 1,
      typed_count = typed_count + (isTyped ? 1 : 0),
      last_visit_time = now(),
      last_visit_type = visitType,
      title = title  -- update title on each visit
    WHERE id = existing.id
  else:
    INSERT INTO history (url, title, visit_count, typed_count,
      last_visit_time, first_visit_time, last_visit_type)
    VALUES (url, title, 1, isTyped ? 1 : 0, now(), now(), visitType)
```

The `isTyped` flag is set when the navigation originated from the omnibox (the user typed the URL or selected a suggestion). This distinction is critical for Chromium-style scoring where typed navigations carry much higher weight.

### 3.5 IPC bridge for history data

Since history lives in the main process (SQLite) but the omnibox runs in the renderer, we need IPC:

```
Main Process                          Renderer Process
-----------                          ----------------
history:getSignificant  -->  IPC  --> HQP data provider
history:search          -->  IPC  --> HUP data provider
history:recordVisit     <--  IPC  <-- Navigation events
shortcuts:search        -->  IPC  --> ShortcutsProvider
shortcuts:recordUsage   <--  IPC  <-- Omnibox selection
bookmarks:search        -->  IPC  --> BookmarkProvider
```

The **significant history** query (for IMUI population) returns entries matching at least one criterion:

- `typed_count >= 1` (ever typed in omnibox)
- `visit_count >= 4` (frequently visited)
- `last_visit_time >= now() - 72 hours` (recently visited)

This matches Chromium's IMUI filtering thresholds.

## 4. In-Memory URL Index (IMUI)

### 4.1 Purpose

The IMUI enables the `HistoryQuickProvider` to return matches in under 20ms. It maintains a pre-built, tokenized index of "significant" history entries entirely in memory on the renderer side.

### 4.2 Index structure

```typescript
interface IMUIEntry {
  historyId: number;
  url: string;
  title: string;
  visitCount: number;
  typedCount: number;
  lastVisitTime: number;
  // Pre-computed for scoring:
  urlTokens: string[]; // tokenized URL parts
  titleTokens: string[]; // tokenized title words
}

class InMemoryURLIndex {
  // Primary data
  private entries: Map<number, IMUIEntry>; // historyId -> entry

  // Inverted indexes
  private wordToIds: Map<string, Set<number>>; // "github" -> {id1, id5, ...}
  private charToWords: Map<string, Set<string>>; // 'g' -> {"github", "google", ...}
  private prefixToWords: Map<string, Set<string>>; // "gi" -> {"github", "git", ...}
}
```

### 4.3 Tokenization

URLs and titles are tokenized by splitting on non-alphanumeric characters, camelCase boundaries, and underscores:

```
"https://github.com/nicolo-ribaudo/tc39-proposal"
  -> ["https", "github", "com", "nicolo", "ribaudo", "tc39", "proposal"]

"MDN Web Docs - JavaScript Reference"
  -> ["mdn", "web", "docs", "javascript", "reference"]
```

All tokens are lowercased. Each token is registered in:

1. `wordToIds`: maps the full token to history entry IDs containing it
2. `charToWords`: maps each unique character to words containing it (enables substring matching)
3. `prefixToWords`: maps 2-3 character prefixes to words starting with them (enables fast prefix lookup)

### 4.4 Query algorithm

```
function query(inputText):
  terms = tokenize(inputText)  // e.g., "git hub" -> ["git", "hub"]

  for each term in terms:
    candidateWords = findMatchingWords(term)  // prefix + substring
    termIds = union(wordToIds[w] for w in candidateWords)
    if first term: resultIds = termIds
    else: resultIds = intersect(resultIds, termIds)

  if |resultIds| > 500: return []  // too many matches, input too short

  candidates = [entries[id] for id in resultIds]
  scored = scoreAndRank(candidates, terms)
  return top3(scored)
```

**`findMatchingWords(term)`** uses a priority cascade:

1. Exact word match: `wordToIds[term]` (highest confidence)
2. Prefix match: `prefixToWords[term[:3]]` filtered by `word.startsWith(term)`
3. Substring match: intersect `charToWords[c]` for each `c` in `term`, then filter by `word.includes(term)`

### 4.5 Population and refresh

The IMUI is populated on omnibox initialization by requesting significant history from the main process. It refreshes incrementally:

- On new history entries: add to index
- On updated entries: update metadata (visit counts, timestamps)
- Periodic full refresh: every 5 minutes or on omnibox focus after idle

## 5. Input Classification

### 5.1 Classification types

```typescript
enum InputType {
  URL = "url", // Clearly a URL (has protocol, dots+TLD, etc.)
  QUERY = "query", // Clearly a search query (multiple words, question)
  UNKNOWN = "unknown", // Ambiguous (single word, could be either)
  FORCED_QUERY = "forced_query", // User prefixed with '?' to force search
  KEYWORD = "keyword" // Matches a keyword/shortcut trigger
}
```

### 5.2 Classification rules

Applied in order (first match wins):

| Rule            | Input Pattern                               | Classification |
| --------------- | ------------------------------------------- | -------------- |
| Forced search   | Starts with `?`                             | `FORCED_QUERY` |
| Has protocol    | Matches `^[a-zA-Z]+://`                     | `URL`          |
| Has port        | Matches `host:port` pattern                 | `URL`          |
| IP address      | Matches IPv4/IPv6                           | `URL`          |
| Trailing slash  | Ends with `/`                               | `URL`          |
| Domain-like     | `word.tld` where tld is known               | `URL`          |
| Keyword trigger | Matches a registered keyword prefix + space | `KEYWORD`      |
| Multi-word      | Contains spaces (after trim)                | `QUERY`        |
| Single word     | Everything else                             | `UNKNOWN`      |

For `UNKNOWN` inputs:

- Default behavior is search-first (verbatim search gets high relevance)
- History/bookmark matches can override if they score high enough
- This matches Chromium's "lean search-first for ambiguous single words" philosophy

### 5.3 Impact on provider behavior

| Provider         | URL                                     | QUERY                     | UNKNOWN | FORCED_QUERY        |
| ---------------- | --------------------------------------- | ------------------------- | ------- | ------------------- |
| HQP              | Run                                     | Run                       | Run     | Run                 |
| HUP              | Run (high relevance for what-you-typed) | Skip what-you-typed       | Run     | Skip what-you-typed |
| SearchProvider   | Run (lower verbatim score)              | Run (high verbatim score) | Run     | Run (high verbatim) |
| BookmarkProvider | Run                                     | Run                       | Run     | Run                 |
| OpenTabProvider  | Run                                     | Run                       | Run     | Run                 |

## 6. Scoring and Ranking

### 6.1 Scoring signals

Each `AutocompleteMatch` carries scoring signals that feed into the final relevance computation:

```typescript
interface ScoringSignals {
  // Behavioral signals
  typedCount: number; // Omnibox navigations to this URL (decayed)
  visitCount: number; // Total visits (decayed)
  elapsedTimeSinceLastVisit: number; // seconds
  shortcutVisitCount: number; // Times selected via this input prefix (decayed)
  shortestShortcutLength: number; // Shortest input that led to this URL

  // Match quality signals
  firstUrlMatchPosition: number; // Position of first match in URL
  totalUrlMatchLength: number; // Total matched characters in URL
  totalTitleMatchLength: number; // Total matched characters in title
  numInputTermsMatchedByUrl: number;
  numInputTermsMatchedByTitle: number;
  hostMatchAtWordBoundary: boolean;
  hasNonSchemeWwwMatch: boolean; // Match is not just in scheme/www

  // Context signals
  isHostOnly: boolean; // URL is just a domain (no path)
  isBookmarked: boolean;
  hasOpenTabMatch: boolean;
  urlLength: number;

  // Provider-specific
  searchSuggestRelevance: number; // Server-provided relevance (for search suggestions)
  isVerbatim: boolean;
  isNavSuggest: boolean;
}
```

### 6.2 Frecency calculation

The core behavioral scoring uses **frecency** (frequency + recency):

```typescript
function calculateFrecency(visits: { time: number; type: VisitType }[], halfLifeDays: number = 30): number {
  const lambda = Math.LN2 / (halfLifeDays * 86400000); // decay constant in ms
  const now = Date.now();

  const TYPE_WEIGHTS: Record<VisitType, number> = {
    typed: 4.0, // Explicitly typed in omnibox
    bookmark: 2.0, // Navigated via bookmark
    link: 1.0, // Followed a link
    redirect: 0.3, // Automatic redirect
    reload: 0.5 // Page reload
  };

  // Sample last 20 visits for efficiency
  const sample = visits.slice(-20);
  let weightedSum = 0;

  for (const visit of sample) {
    const elapsed = now - visit.time;
    const decay = Math.exp(-lambda * elapsed);
    const typeWeight = TYPE_WEIGHTS[visit.type] ?? 1.0;
    weightedSum += typeWeight * decay;
  }

  const avgScore = sample.length > 0 ? weightedSum / sample.length : 0;

  // Scale by total visit count (sublinear to prevent dominance)
  return avgScore * Math.log1p(visits.length);
}
```

### 6.3 Match quality scoring

Match quality is scored by analyzing _how_ the input matches the candidate:

```typescript
function scoreMatchQuality(input: string, url: string, title: string, terms: string[]): MatchQualityScore {
  const urlLower = url.toLowerCase();
  const titleLower = title.toLowerCase();
  const parsedUrl = new URL(url);
  const host = parsedUrl.hostname.replace(/^www\./, "");

  let score = 0;

  // 1. Host match is most valuable
  for (const term of terms) {
    if (host.startsWith(term)) {
      score += 0.4; // Host prefix match - very strong
    } else if (host.includes(term)) {
      score += 0.25; // Host substring match
    }
  }

  // 2. URL path match
  const path = parsedUrl.pathname + parsedUrl.search;
  for (const term of terms) {
    if (path.includes(term)) {
      score += 0.15; // Path match
    }
  }

  // 3. Title match
  for (const term of terms) {
    const titleWords = titleLower.split(/\s+/);
    if (titleWords.some((w) => w.startsWith(term))) {
      score += 0.15; // Title word-boundary match
    } else if (titleLower.includes(term)) {
      score += 0.08; // Title substring match
    }
  }

  // 4. Term coverage bonus
  const urlTermMatches = terms.filter((t) => urlLower.includes(t)).length;
  const titleTermMatches = terms.filter((t) => titleLower.includes(t)).length;
  const termCoverage = Math.max(urlTermMatches, titleTermMatches) / terms.length;
  score += termCoverage * 0.2;

  return clamp(score, 0, 1);
}
```

### 6.4 Combined relevance computation

Each provider assigns an initial relevance within its allowed range. The scoring engine then adjusts based on combined signals:

```typescript
function computeRelevance(match: AutocompleteMatch, signals: ScoringSignals, inputType: InputType): number {
  // Provider base ranges (Chromium-inspired)
  const BASE_RANGES = {
    "url-what-you-typed": { min: 1150, max: 1200 },
    "history-url": { min: 900, max: 1400 },
    "open-tab": { min: 1100, max: 1500 },
    "search-query": { min: 300, max: 1000 },
    verbatim: { min: 1250, max: 1300 },
    "zero-suggest": { min: 300, max: 800 },
    pedal: { min: 1100, max: 1200 },
    bookmark: { min: 900, max: 1350 },
    shortcut: { min: 1000, max: 1450 }
  };

  const range = BASE_RANGES[match.type] ?? { min: 0, max: 1000 };

  // Frecency component (0..1)
  const frecencyNorm = clamp(Math.log1p(signals.frecency) / Math.log1p(MAX_EXPECTED_FRECENCY), 0, 1);

  // Match quality component (0..1) - from scoreMatchQuality
  const matchQuality = signals.matchQualityScore;

  // Input length weighting: longer input -> more weight on match quality
  const inputLen = clamp(input.text.length, 1, 30);
  const frecencyWeight = Math.max(0.3, 0.7 - inputLen * 0.02);
  const matchWeight = 1.0 - frecencyWeight;

  // Combined score (0..1)
  const combined = frecencyNorm * frecencyWeight + matchQuality * matchWeight;

  // Map to provider's range
  let relevance = range.min + combined * (range.max - range.min);

  // Bonuses
  if (signals.isBookmarked) relevance += 30;
  if (signals.hasOpenTabMatch) relevance += 50;
  if (signals.hostMatchAtWordBoundary) relevance += 20;
  if (signals.isHostOnly && inputType === InputType.URL) relevance += 40;

  // Penalties
  if (!signals.hasNonSchemeWwwMatch) relevance -= 50; // Only matched scheme/www
  if (signals.urlLength > 200) relevance -= 20; // Very long URLs

  return Math.round(clamp(relevance, range.min, range.max + 100));
}
```

### 6.5 Verbatim and what-you-typed scoring

Chromium uses specific constants for baseline scores:

| Match type                       | Relevance | Condition                           |
| -------------------------------- | --------- | ----------------------------------- |
| Verbatim search ("Search for X") | 1300      | Input is not a URL                  |
| Verbatim search (URL-like input) | 1250      | Input looks like a URL              |
| What-you-typed URL               | 1150-1200 | Input is parseable as URL           |
| History exact match              | 1400-1450 | URL exactly matches a history entry |

These ensure that:

- Typing a known URL always offers "go to that URL" near the top
- Typing a search query always offers "search for X" near the top
- History matches can beat both when confidence is high

## 7. Inline Autocompletion

### 7.1 Design principles (from Chromium)

1. **Synchronous only**: Inline completion must come from sync providers (HQP, BookmarkProvider, ShortcutsProvider) to prevent flicker.
2. **Prefix match required**: The candidate URL must start with the typed text (after scheme normalization).
3. **Stability**: Once shown, inline completion should not change unless the user types more characters.
4. **Conservative threshold**: Only offer inline completion for high-confidence matches (relevance > 1200).

### 7.2 Implementation

```typescript
interface InlineCompletionCandidate {
  fullUrl: string; // "https://github.com/user/repo"
  completionText: string; // "hub.com/user/repo" (what gets appended)
  relevance: number;
}

function computeInlineCompletion(input: string, matches: AutocompleteMatch[]): InlineCompletionCandidate | null {
  if (input.length < 2) return null; // Too short for reliable completion

  const inputLower = input.toLowerCase();

  for (const match of matches) {
    if (match.relevance < 1200) continue;
    if (match.type === "search-query" || match.type === "pedal") continue;

    const url = match.destinationUrl;
    const urlLower = url.toLowerCase();

    // Try matching with various prefix normalizations
    const prefixes = [
      urlLower, // exact
      urlLower.replace(/^https?:\/\//, ""), // without scheme
      urlLower.replace(/^https?:\/\/www\./, "") // without scheme+www
    ];

    for (const prefix of prefixes) {
      if (prefix.startsWith(inputLower)) {
        const completionText = url.slice(url.toLowerCase().indexOf(inputLower) + input.length);
        if (completionText.length > 0) {
          return {
            fullUrl: url,
            completionText,
            relevance: match.relevance
          };
        }
      }
    }
  }

  return null;
}
```

### 7.3 UI integration

The input field renders inline completion as ghost text:

```
User types:  "gith"
Display:     "gith|ub.com"
                   ^^^^^^ ghost text (muted/gray, selected range)
```

- Right Arrow or Tab: accepts the completion
- Any other character: replaces the ghost text with continued typing
- The ghost text is implemented via an overlay span or selection range, not by modifying the input value

## 8. Deduplication

### 8.1 URL normalization

Before comparing URLs for deduplication:

```typescript
function normalizeUrlForDedup(url: string): string {
  try {
    const parsed = new URL(url);

    // Normalize scheme (treat http/https as same for dedup)
    // Normalize host (lowercase, remove www.)
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);

    // Normalize path (remove trailing slash for root paths)
    let path = parsed.pathname;
    if (path === "/") path = "";

    // Sort query parameters for consistent comparison
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());

    return `${host}${path}${sortedParams.toString() ? "?" + sortedParams.toString() : ""}${parsed.hash}`;
  } catch {
    return url.toLowerCase();
  }
}
```

### 8.2 Merge strategy

When two matches have the same normalized URL:

1. Keep the match with the **higher relevance score**.
2. Merge metadata from the duplicate:
   - If one is a bookmark match and the other is history, mark as bookmarked.
   - If one has an open tab match, preserve that signal.
   - Combine description text (prefer non-empty title).
3. Preserve the winning match's provider name and type.

## 9. Default Match Stability

### 9.1 Problem

Without stability guarantees, the top suggestion flickers as async providers return results. This is jarring when the user is about to press Enter.

### 9.2 Rules

1. **Sync-first default**: After the synchronous pass, the top match becomes the "tentative default."
2. **Default preservation**: On async updates, the new top match only replaces the default if:
   - Its relevance exceeds the current default by > 100 points, OR
   - The current default was a verbatim/what-you-typed (low confidence), OR
   - The input has changed since the default was set
3. **Arrow-key lock**: Once the user starts navigating with arrow keys, suppress all result updates until the next keystroke. Store pending updates and apply them on the next character input.
4. **Short input caution**: For inputs of 1-2 characters, be more conservative about setting a non-verbatim default (require > 1300 relevance).

### 9.3 Implementation

```typescript
class AutocompleteController {
  private defaultMatch: AutocompleteMatch | null = null;
  private userIsNavigating: boolean = false;
  private pendingUpdates: AutocompleteMatch[][] = [];

  onUserArrowKey(): void {
    this.userIsNavigating = true;
  }

  onUserKeystroke(input: AutocompleteInput): void {
    this.userIsNavigating = false;
    // Apply any pending updates before processing new input
    this.applyPendingUpdates();
    this.start(input);
  }

  private shouldUpdateDefault(newTop: AutocompleteMatch): boolean {
    if (!this.defaultMatch) return true;
    if (this.defaultMatch.type === "verbatim") return true;
    if (newTop.relevance > this.defaultMatch.relevance + 100) return true;
    return false;
  }
}
```

## 10. Provider Specifications

### 10.1 HistoryQuickProvider (HQP)

**Data source**: InMemoryURLIndex (renderer-side)
**Latency target**: < 20ms
**Max results**: 3
**Match types**: `history-url`

Scoring combines:

- Frecency of the history entry (pre-computed in IMUI)
- Match quality (host match > path match > title match; prefix > substring)
- Inline completion eligibility (prefix matches get a bonus)

This provider is the backbone of the "type a few characters, get your frequent site" experience.

### 10.2 HistoryURLProvider (HUP)

**Data source**: History SQLite table (via IPC)
**Latency**: Async (50-200ms)
**Max results**: 1 (what-you-typed) + overflow from DB query
**Match types**: `url-what-you-typed`, `history-url`

Responsibilities:

- Generate the "what-you-typed" match for URL-like inputs
- Query the full history DB for matches not in the IMUI (less significant entries)

The what-you-typed match is generated synchronously and sent immediately. DB results arrive async.

### 10.3 SearchProvider

**Data source**: Google Suggest API + local search history
**Latency**: Verbatim sync, suggestions async (100-500ms)
**Max results**: 1 verbatim + up to 5 suggestions
**Match types**: `verbatim`, `search-query`, `navsuggest`

Improvements over current implementation:

1. **Parse server relevance**: Use `google:suggestrelevance` from the response to set suggestion scores
2. **Parse suggestion types**: Use `google:suggesttype` to differentiate QUERY, NAVIGATION, ENTITY, etc.
3. **NavSuggest support**: When server returns NAVIGATION type, create a `navsuggest` match that navigates directly to the URL instead of searching
4. **Debouncing**: Don't send API requests for every keystroke; debounce 50-100ms after typing pause
5. **Verbatim relevance**: Use `google:verbatimrelevance` from server when available

### 10.4 BookmarkProvider

**Data source**: Bookmarks SQLite table (via IPC, cached in renderer)
**Latency target**: < 10ms (cached)
**Max results**: 3
**Match types**: `bookmark`

Matching against both URL and title of bookmarks. Bookmarked URLs receive a relevance bonus across all providers (the `isBookmarked` signal).

### 10.5 ShortcutsProvider

**Data source**: Shortcuts SQLite table (via IPC)
**Latency**: Async but fast
**Max results**: 3
**Match types**: `shortcut`

Learns from user behavior: when the user types "gi" and selects "github.com", record that mapping. On future "gi" inputs, offer "github.com" with high confidence.

Shortcuts use a 7-day half-life decay (shorter than history's 30 days) because shortcut relevance is more ephemeral -- it reflects recent habits.

### 10.6 OpenTabProvider

**Data source**: `flow.tabs.getData()` (renderer-side)
**Latency**: < 5ms
**Max results**: 3
**Match types**: `open-tab`

Improvements:

- Remove the minimum 3-character requirement (Chromium matches at 1 character)
- Use tokenized matching instead of Dice coefficient
- Higher base relevance (switching to an already-open tab is usually the right action)

### 10.7 ZeroSuggestProvider

**Data source**: Recent history + open tabs + most-visited
**Latency**: < 20ms
**Max results**: 8
**Match types**: `zero-suggest`, `open-tab`

Triggered only on focus with empty input. Shows:

1. Recent open tabs (top 5, sorted by last-active)
2. Most visited sites from history (top 3-5, by frecency)

### 10.8 OmniboxPedalProvider

**Data source**: Hardcoded action registry
**Latency**: < 1ms
**Max results**: 1
**Match types**: `pedal`

No changes needed. Current implementation is adequate. Consider adding more pedals over time:

- "Clear browsing data"
- "Open downloads"
- "Open history"
- "Manage passwords"

## 11. Revised Type Definitions

```typescript
/** Input classification result */
enum InputType {
  URL = "url",
  QUERY = "query",
  UNKNOWN = "unknown",
  FORCED_QUERY = "forced_query",
  KEYWORD = "keyword"
}

/** Why the query is being run */
type InputTrigger = "focus" | "keystroke" | "paste";

/** Represents the input state for an autocomplete query. */
interface AutocompleteInput {
  text: string;
  currentURL?: string;
  trigger: InputTrigger;
  inputType: InputType; // NEW: classification result
  preventInlineAutocomplete: boolean; // NEW: explicit flag
  terms: string[]; // NEW: pre-tokenized input terms
}

/** Match types - expanded */
type MatchType =
  | "history-url"
  | "zero-suggest"
  | "verbatim"
  | "url-what-you-typed"
  | "search-query"
  | "search-history" // NEW
  | "navsuggest" // NEW
  | "open-tab"
  | "pedal"
  | "bookmark" // NEW
  | "shortcut"; // NEW

/** Represents a single autocomplete suggestion. */
interface AutocompleteMatch {
  providerName: string;
  relevance: number;
  contents: string;
  description?: string;
  destinationUrl: string;
  type: MatchType;
  isDefault?: boolean;
  inlineCompletion?: string;

  // NEW: scoring metadata
  scoringSignals?: ScoringSignals;
  // NEW: dedup key (normalized URL)
  dedupKey?: string;
  // NEW: is this match allowed to be the default?
  allowedToBeDefault: boolean;
}
```

## 12. Search Suggestions Enhancement

### 12.1 Current problem

The current `SearchProvider` ignores the rich metadata Google returns:

```json
[
  "gith",
  ["github", "github copilot", "github desktop", "github actions"],
  ["", "", "", ""],
  [],
  {
    "google:suggestrelevance": [601, 600, 553, 552],
    "google:suggesttype": ["QUERY", "QUERY", "QUERY", "QUERY"],
    "google:verbatimrelevance": 851
  }
]
```

The current code throws away `suggestrelevance`, `suggesttype`, and `verbatimrelevance`.

### 12.2 Improvements

```typescript
interface ParsedSuggestion {
  text: string;
  type: "QUERY" | "NAVIGATION" | "ENTITY" | "TAIL" | "CALCULATOR";
  serverRelevance: number;
  url?: string; // For NAVIGATION type
}

function parseGoogleSuggestions(response: GoogleSuggestResponse): {
  suggestions: ParsedSuggestion[];
  verbatimRelevance: number;
} {
  const metadata = response[4];
  const relevances = metadata?.["google:suggestrelevance"] ?? [];
  const types = metadata?.["google:suggesttype"] ?? [];
  const verbatimRelevance = metadata?.["google:verbatimrelevance"] ?? 1300;

  const suggestions: ParsedSuggestion[] = response[1].map((text, i) => ({
    text,
    type: (types[i] as ParsedSuggestion["type"]) ?? "QUERY",
    serverRelevance: relevances[i] ?? 800 - i * 50,
    url: types[i] === "NAVIGATION" ? text : undefined
  }));

  return { suggestions, verbatimRelevance };
}
```

**NavSuggest handling**: When `suggesttype` is `"NAVIGATION"`, the suggestion is a URL prediction, not a query completion. It should be rendered with a globe icon and navigate directly to the URL instead of searching.

## 13. Implementation Plan

### Phase 1: Foundation (History + Improved Matching)

**Goal**: Get history working end-to-end with real data and better matching.

1. **Add history schema** to `schema.ts` and generate migration
2. **Build history collection** in main process (observe navigations, track typed vs linked)
3. **Add IPC handlers** for `history:getSignificant`, `history:search`, `history:recordVisit`
4. **Replace `string-similarity-js`** with tokenized multi-term matching
5. **Update `HistoryURLProvider`** to use real history data via IPC
6. **Update `ZeroSuggestProvider`** to use real history data
7. **Add basic frecency scoring** (visit count + recency decay)

**Deliverable**: Typing in the omnibox surfaces real browsing history with decent relevance.

### Phase 2: In-Memory Index + Inline Completion

**Goal**: Sub-20ms history suggestions and inline autocompletion.

1. **Build `InMemoryURLIndex`** class with tokenization and inverted index
2. **Build `HistoryQuickProvider`** using IMUI (replaces current HistoryURLProvider for fast path)
3. **Add inline autocompletion logic** (prefix matching, ghost text computation)
4. **Update UI** to render inline completion (ghost text in input field)
5. **Add input classification** (`InputClassifier`) to distinguish URL/search/ambiguous

**Deliverable**: Instant history suggestions, inline URL completion like Chrome.

### Phase 3: Search Provider Enhancement

**Goal**: Fully utilize Google's suggestion API response.

1. **Parse server relevance scores** from `google:suggestrelevance`
2. **Parse suggestion types** from `google:suggesttype`
3. **Add NavSuggest support** for NAVIGATION-type suggestions
4. **Use `google:verbatimrelevance`** for verbatim match scoring
5. **Add debouncing** (50ms after typing pause)
6. **Add request deduplication** (cancel in-flight requests on new input)

**Deliverable**: Search suggestions ranked by Google's own relevance, with navigational suggestions.

### Phase 4: Bookmarks + Shortcuts

**Goal**: Additional data sources for richer suggestions.

1. **Add bookmarks schema** and CRUD operations
2. **Build BookmarkProvider** with title+URL matching
3. **Add shortcuts schema** and recording logic
4. **Build ShortcutsProvider** with learned input-to-destination mapping
5. **Record shortcut on selection**: when user picks a suggestion, save the input->destination mapping
6. **Cross-provider dedup enhancement**: bookmark+history merge, shortcut+history merge

**Deliverable**: Bookmarks appear in suggestions; frequently-selected results become shortcuts.

### Phase 5: Stability + Polish

**Goal**: Chrome-quality UX stability and refinement.

1. **Implement default match stability** (sync-first default, preservation rules)
2. **Arrow-key navigation lock** (suppress updates during keyboard navigation)
3. **URL normalization for dedup** (scheme, www, trailing slash normalization)
4. **Improved scoring engine** with all signals combined
5. **IMUI cache/restore** for fast startup
6. **Update omnibox-debug page** to show scoring signals, IMUI state, provider timings

**Deliverable**: Stable, non-flickering suggestions that feel as solid as Chrome's.

### Phase 6: Advanced (Future)

- Recently closed tabs as a suggestion source
- Tab-to-Search (keyword shortcuts for site-specific search)
- Site engagement scoring (dwell time tracking)
- Clipboard provider (suggest clipboard URL on focus)
- Rich autocompletion (title-based completion, not just URL prefix)

## 14. File Map (New/Modified Files)

### New files

```
src/main/saving/db/schema.ts              -- ADD history, shortcuts, bookmarks tables
src/main/saving/history/                   -- NEW directory
  history-service.ts                       -- History collection, recording, querying
src/main/saving/bookmarks/                 -- NEW directory
  bookmarks-service.ts                     -- Bookmark CRUD
src/main/ipc/data/                         -- NEW directory
  history.ts                               -- IPC handlers for history
  shortcuts.ts                             -- IPC handlers for shortcuts
  bookmarks.ts                             -- IPC handlers for bookmarks

src/renderer/src/lib/omnibox/
  input-classifier.ts                      -- NEW: Input classification logic
  in-memory-url-index.ts                   -- NEW: IMUI implementation
  scoring-engine.ts                        -- NEW: Combined scoring logic
  frecency.ts                              -- NEW: Frecency calculation
  url-normalizer.ts                        -- NEW: URL normalization for dedup
  tokenizer.ts                             -- NEW: Text tokenization utilities
  providers/
    history-quick.ts                        -- NEW: HQP using IMUI
    bookmark.ts                             -- NEW: BookmarkProvider
    shortcut.ts                             -- NEW: ShortcutsProvider
  data-providers/
    history.ts                             -- REWRITE: Real IPC-based data fetching
    bookmarks.ts                           -- NEW: Bookmark data fetching
    shortcuts.ts                           -- NEW: Shortcut data fetching
```

### Modified files

```
src/renderer/src/lib/omnibox/
  types.ts                                 -- Expand types (InputType, ScoringSignals, etc.)
  omnibox.ts                               -- Add HQP, BookmarkProvider, ShortcutsProvider
  autocomplete-controller.ts               -- Stability logic, input classification, scoring pass
  autocomplete-result.ts                   -- URL normalization dedup, metadata merge
  base-provider.tsx                        -- No changes needed
  providers/
    search.ts                              -- Parse server relevance, navsuggestions, debounce
    history-url.ts                         -- Use real history, improved scoring
    open-tab.ts                            -- Tokenized matching, remove min-length
    zero-suggest.ts                        -- Use real history frecency
    pedal.ts                               -- No changes

src/renderer/src/components/omnibox/
  main.tsx                                 -- Inline completion UI, stability hooks

src/renderer/src/lib/
  search.ts                                -- Return full parsed response with metadata
  url.ts                                   -- Add URL normalization utilities

src/main/saving/db/
  schema.ts                                -- Add history, shortcuts, bookmarks tables

src/shared/flow/interfaces/browser/
  omnibox.ts                               -- Expand API if needed for new IPC
```

## 15. Key Design Decisions

### Why tokenized matching over Dice coefficient

The current `string-similarity-js` (Dice coefficient on bigrams) has fundamental problems for an omnibox:

- It measures overall string similarity, not substring/prefix matching
- "git" scores poorly against "github.com/user/repo" because the bigram overlap is tiny relative to the full string
- It cannot distinguish "match at host" vs "match in path" vs "match in title"
- It fails multi-term queries entirely (no term intersection)
- It has a hard threshold (0.4) that causes binary match/no-match behavior

Tokenized matching provides:

- Prefix and substring matching within individual tokens
- Multi-term intersection (all terms must match)
- Position-aware scoring (host > path > title)
- Graduated scoring (not binary)
- Sub-20ms performance via inverted index

### Why separate HQP and HUP

Chromium separates these for a critical reason: **HQP must be synchronous** (serves inline completion, sets initial default match) while HUP can be async (queries the full database). The IMUI only indexes "significant" entries (~thousands), but the full history DB may contain hundreds of thousands of entries.

In our case, HQP runs against the renderer-side IMUI (instant), while HUP queries the main-process SQLite DB (requires IPC round-trip, ~50ms minimum).

### Why record shortcuts separately from history

History records _what the user visited_. Shortcuts record _what the user selected in the omnibox given specific input text_. These are different signals:

- History: "User visited github.com 50 times" (doesn't tell us what they typed)
- Shortcut: "When user typed 'gi', they selected github.com 12 times" (direct input-to-output mapping)

Shortcuts enable the omnibox to learn individual typing patterns. A user who always types "gi" for GitHub gets instant high-confidence completion, while another user who types "gi" for GitLab gets their preference learned separately.

### Why not ML scoring initially

Chromium's ML scoring requires:

- A trained model (we have no training data)
- TFLite runtime (adds binary size)
- Feature extraction pipeline (complex)
- Logging infrastructure (to collect training data)

The rule-based scoring described in this document approximates the key signals that Chromium's ML model uses (frecency, match quality, context). Once we have enough usage data and logging, ML scoring can be added as a future enhancement layer on top of the rule-based system.

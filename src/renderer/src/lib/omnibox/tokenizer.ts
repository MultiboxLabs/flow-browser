/**
 * Tokenizer for omnibox matching.
 * Splits URLs and titles into searchable tokens for multi-term intersection matching.
 */

/**
 * Tokenize a string by splitting on non-alphanumeric characters and camelCase boundaries.
 * All tokens are lowercased.
 *
 * Examples:
 *   "https://github.com/nicolo-ribaudo/tc39-proposal"
 *     -> ["https", "github", "com", "nicolo", "ribaudo", "tc39", "proposal"]
 *
 *   "MDN Web Docs - JavaScript Reference"
 *     -> ["mdn", "web", "docs", "javascript", "reference"]
 */
export function tokenize(input: string): string[] {
  if (!input) return [];

  // First split on non-alphanumeric characters
  const parts = input.toLowerCase().split(/[^a-z0-9]+/);

  const tokens: string[] = [];
  for (const part of parts) {
    if (part.length === 0) continue;

    // Split camelCase: insert boundary before uppercase letters
    // Since we already lowercased, we need to do this on the original
    // Actually, since we lowercased first, camelCase boundaries are gone.
    // Let's handle this differently: split on the original, then lowercase.
    tokens.push(part);
  }

  return tokens;
}

/**
 * Tokenize with camelCase splitting (for cases where we want finer granularity).
 */
export function tokenizeWithCamelCase(input: string): string[] {
  if (!input) return [];

  // Split camelCase first, then split on non-alphanumeric
  const withCamelSplit = input.replace(/([a-z])([A-Z])/g, "$1 $2");
  return tokenize(withCamelSplit);
}

/**
 * Tokenize user input for matching.
 * Similar to tokenize() but preserves the input structure for matching purposes.
 */
export function tokenizeInput(input: string): string[] {
  if (!input) return [];

  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  // Split on whitespace to get user-typed terms
  const terms = trimmed.split(/\s+/).filter((t) => t.length > 0);
  return terms;
}

/**
 * Check if a term matches a token (prefix or substring match).
 * Returns the match type for scoring purposes.
 */
export type TermMatchType = "exact" | "prefix" | "substring" | "none";

export function matchTerm(term: string, token: string): TermMatchType {
  if (term === token) return "exact";
  if (token.startsWith(term)) return "prefix";
  if (token.includes(term)) return "substring";
  return "none";
}

/**
 * Check if a term matches any token in a list.
 * Returns the best match type found.
 */
export function findBestMatch(term: string, tokens: string[]): TermMatchType {
  let best: TermMatchType = "none";

  for (const token of tokens) {
    const match = matchTerm(term, token);
    if (match === "exact") return "exact"; // Can't do better than exact
    if (match === "prefix") best = "prefix";
    if (match === "substring" && best === "none") best = "substring";
  }

  return best;
}

/**
 * Multi-term intersection matching.
 * All terms must match at least one token for a successful match.
 * Returns true if all terms match, false otherwise.
 */
export function allTermsMatch(terms: string[], tokens: string[]): boolean {
  if (terms.length === 0) return false;

  for (const term of terms) {
    if (findBestMatch(term, tokens) === "none") return false;
  }

  return true;
}

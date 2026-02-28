/**
 * URL normalization for deduplication.
 * Normalizes URLs so that equivalent URLs hash to the same key.
 */

/**
 * Normalize a URL for deduplication purposes.
 * Treats http/https as equivalent, removes www., normalizes trailing slashes,
 * and sorts query parameters.
 *
 * @param url The URL to normalize
 * @returns Normalized URL string suitable for dedup comparison
 */
export function normalizeUrlForDedup(url: string): string {
  try {
    const parsed = new URL(url);

    // Normalize host (lowercase, remove www.)
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith("www.")) host = host.slice(4);

    // Normalize path (remove trailing slash for root paths)
    let path = parsed.pathname;
    if (path === "/") path = "";

    // Sort query parameters for consistent comparison
    const params = new URLSearchParams(parsed.search);
    const sortedParams = new URLSearchParams([...params.entries()].sort());
    const queryString = sortedParams.toString();

    return `${host}${path}${queryString ? "?" + queryString : ""}${parsed.hash}`;
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Strip scheme and www from a URL for display and matching purposes.
 *
 * @param url The URL to strip
 * @returns URL without scheme and www prefix
 */
export function stripSchemeAndWww(url: string): string {
  return url
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

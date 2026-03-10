/**
 * URL normalization for deduplication.
 * Normalizes URLs so that equivalent URLs hash to the same key.
 *
 * Enhanced in Phase 5:
 *   - Normalize trailing slashes on all paths (not just root)
 *   - Normalize default ports (80 for http, 443 for https)
 *   - Lowercase percent-encoding
 *   - Ignore fragment for dedup
 */

/**
 * Normalize a URL for deduplication purposes.
 * Treats http/https as equivalent, removes www., normalizes trailing slashes,
 * normalizes default ports, and sorts query parameters.
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

    // new URL() already strips scheme-default ports, so any remaining port is significant.
    const port = parsed.port;
    const hasNonDefaultPort = port !== "";
    const portSuffix = hasNonDefaultPort ? `:${port}` : "";

    // Normalize path: remove trailing slash (for all paths, not just root)
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    if (path === "/") path = "";

    // Normalize percent-encoding (lowercase hex digits, decode unreserved)
    path = normalizePercentEncoding(path);

    // Sort query parameters for consistent comparison
    const params = new URLSearchParams(parsed.search);
    const sortedEntries = [...params.entries()].sort((a, b) => {
      const keyCompare = a[0].localeCompare(b[0]);
      if (keyCompare !== 0) return keyCompare;
      return a[1].localeCompare(b[1]);
    });
    const sortedParams = new URLSearchParams(sortedEntries);
    const queryString = sortedParams.toString();

    // Ignore fragment for dedup (github.com/foo#bar == github.com/foo)
    return `${host}${portSuffix}${path}${queryString ? "?" + queryString : ""}`;
  } catch {
    return url.toLowerCase();
  }
}

/**
 * Normalize percent-encoded characters in a URL path.
 * Lowercases hex digits and decodes unreserved characters.
 */
function normalizePercentEncoding(str: string): string {
  return str.replace(/%([0-9A-Fa-f]{2})/g, (_match, hex: string) => {
    const charCode = parseInt(hex, 16);
    // Decode unreserved characters (RFC 3986: ALPHA, DIGIT, '-', '.', '_', '~')
    if (
      (charCode >= 0x41 && charCode <= 0x5a) || // A-Z
      (charCode >= 0x61 && charCode <= 0x7a) || // a-z
      (charCode >= 0x30 && charCode <= 0x39) || // 0-9
      charCode === 0x2d || // -
      charCode === 0x2e || // .
      charCode === 0x5f || // _
      charCode === 0x7e // ~
    ) {
      return String.fromCharCode(charCode);
    }
    // Keep encoded but with uppercase hex digits for consistency
    return `%${hex.toUpperCase()}`;
  });
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

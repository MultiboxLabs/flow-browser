import { debugPrint } from "@/modules/output";

/**
 * Match a URL against a pattern following the match pattern format:
 * <scheme>://<host><path>
 *
 * Special pattern "<all_urls>" matches any URL with supported schemes.
 *
 * @see https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns
 */
export function matchPattern(pattern: string, url: string): boolean {
  // Handle the special case
  if (pattern === "<all_urls>") {
    const supportedSchemes = ["http:", "https:", "ws:", "wss:", "ftp:", "data:", "file:"];
    try {
      const parsedUrl = new URL(url);
      return supportedSchemes.includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  // Extract the parts of the pattern
  const patternRegex = /^((\*|https?|wss?|ftp|file|data):)\/\/((\*|[^/*]+|\*\.[^/*]+))(\/.*)?$/;
  const match = pattern.match(patternRegex);

  if (!match) {
    debugPrint("MATCH_PATTERN", `Invalid match pattern: ${pattern}`);
    return false;
  }

  try {
    const targetUrl = new URL(url);

    // Scheme check
    const schemePattern = match[2];
    if (schemePattern === "*") {
      // * only matches http, https, ws, wss
      if (!["http:", "https:", "ws:", "wss:"].includes(targetUrl.protocol)) {
        return false;
      }
    } else if (`${schemePattern}:` !== targetUrl.protocol) {
      return false;
    }

    // Host check
    const hostPattern = match[3];
    if (hostPattern === "*") {
      // Matches any host
    } else if (hostPattern.startsWith("*.")) {
      const suffix = hostPattern.substring(2);
      if (!targetUrl.hostname.endsWith(suffix) || targetUrl.hostname.length === suffix.length) {
        return false;
      }
    } else if (hostPattern !== targetUrl.hostname) {
      return false;
    }

    // Path check
    const pathPattern = match[5] || "/*";

    // Convert the path pattern to a regex
    const pathRegexStr = pathPattern.replace(/\*/g, ".*").replace(/\?/g, "\\?");

    // The path includes both pathname and search parts
    const targetPath = targetUrl.pathname + (targetUrl.search || "");

    const pathRegex = new RegExp(`^${pathRegexStr}$`);
    return pathRegex.test(targetPath);
  } catch (error) {
    debugPrint("WEB_REQUESTS", `Error matching URL pattern: ${error}`);
    return false;
  }
}

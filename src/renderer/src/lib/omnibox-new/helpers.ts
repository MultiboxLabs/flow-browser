import { parse as parseTld } from "tldts";
import type { OmniboxSuggestion } from "./types";

export type OmniboxFlush = (items: OmniboxSuggestion[]) => void;

/**
 * Wraps `flush` so late calls from an older request are ignored after a newer
 * `getOmniboxSuggestions` run has started. Increment a shared counter (or ref)
 * before each request; pass the captured id and a getter that returns the
 * latest id (same ref).
 */
export function guardOmniboxFlush(
  requestId: number,
  getCurrentRequestId: () => number,
  flush: OmniboxFlush
): OmniboxFlush {
  return (items) => {
    if (requestId !== getCurrentRequestId()) return;
    flush(items);
  };
}

const ipv4Pattern = /^(?:\d{1,3}\.){3}\d{1,3}$/;

function isValidIpv4(hostname: string): boolean {
  if (!ipv4Pattern.test(hostname)) {
    return false;
  }

  return hostname.split(".").every((segment) => {
    const value = Number(segment);
    return value >= 0 && value <= 255;
  });
}

/**
 * Returns a navigable URL for omnibox input, or `null` when the input should
 * be treated as a search instead.
 *
 * This is intentionally more user-friendly than strict URL parsing:
 * bare domains like `google.com`, domains with paths or ports, `localhost`,
 * IPv4 addresses, and fully qualified URLs all count as valid. Bare hosts are
 * normalized to `https://...` so the returned value is ready to open.
 */
export function isValidUrl(value: string): string | null {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  const parsedWithScheme = URL.parse(trimmedValue);
  if (parsedWithScheme?.hostname) {
    return parsedWithScheme.toString();
  }

  const candidate = URL.parse(`http://${trimmedValue}`);
  const hostname = candidate?.hostname;
  if (!hostname) {
    return null;
  }

  if (hostname === "localhost" || isValidIpv4(hostname)) {
    return candidate.toString();
  }

  const tldResult = parseTld(hostname, { allowPrivateDomains: true });
  if (tldResult.domain === null) {
    return null;
  }

  return candidate.toString();
}

export function generateTitleFromUrl(url: string): string {
  // strip scheme if it is http or https, `www.` and trailing slashes
  const trimmed = url.trim();
  if (!trimmed) {
    return "";
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return trimmed;
  }

  let pathname = parsed.pathname;
  if (pathname !== "/" && pathname.endsWith("/")) {
    pathname = pathname.replace(/\/+$/, "");
  }
  const pathAndQuery = `${pathname === "/" ? "" : pathname}${parsed.search}${parsed.hash}`;

  const isHttp = parsed.protocol === "http:" || parsed.protocol === "https:";
  if (!isHttp) {
    const canUseAuthority = parsed.host !== "" || (parsed.protocol === "file:" && parsed.pathname.startsWith("/"));
    if (!canUseAuthority) {
      return parsed.href;
    }
    return `${parsed.protocol}//${parsed.host}${pathAndQuery}`;
  }

  const hostname = parsed.hostname.replace(/^www\./i, "");
  const needsIpv6Brackets = hostname.includes(":") && !hostname.startsWith("[");
  const formattedHostname = needsIpv6Brackets ? `[${hostname}]` : hostname;
  const host = parsed.port !== "" ? `${formattedHostname}:${parsed.port}` : formattedHostname;

  return pathAndQuery ? `${host}${pathAndQuery}` : host;
}

import { parse as parseTld } from "tldts";

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

  const candidate = URL.parse(`https://${trimmedValue}`);
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

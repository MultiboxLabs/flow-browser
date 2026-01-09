// Check if a domain is on the Public Suffix List

import { parse as parseTld } from "tldts";

export function isPublicSuffix(d: string) {
  const r = parseTld(d, { allowPrivateDomains: false });
  // If it's a public suffix, it has no registrable domain.
  return r.domain === null;
}

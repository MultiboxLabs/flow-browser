import net from "node:net";
import { domainToASCII } from "node:url";

export type RpIdCheckOptions = {
  allowInsecureLocalhost?: boolean;

  /**
   * Return true if the input is a public suffix (eTLD), e.g. "com", "co.uk".
   * Strongly recommended to implement using PSL (e.g. tldts).
   */
  isPublicSuffix?: (domain: string) => boolean;
};

export type RpIdCheckResult = { ok: true; rpId: string } | { ok: false; rpId: string; reason: string };

export function isRpIdAllowedForOrigin(
  origin: string,
  rpIdInput?: string,
  opts: RpIdCheckOptions = {}
): RpIdCheckResult {
  const allowInsecureLocalhost = opts.allowInsecureLocalhost ?? true;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return { ok: false, rpId: normalizeRpId(rpIdInput ?? ""), reason: "Invalid origin URL" };
  }

  const scheme = url.protocol.toLowerCase();
  const originHost = normalizeHost(url.hostname);
  if (!originHost) return { ok: false, rpId: normalizeRpId(rpIdInput ?? ""), reason: "Origin has no hostname" };

  // Secure-context-ish gate (browser-ish)
  const originIsIP = net.isIP(originHost) !== 0;
  const originIsLocalhost = originHost === "localhost" || originIsIP;
  const secureEnough =
    scheme === "https:" || scheme === "wss:" || (allowInsecureLocalhost && scheme === "http:" && originIsLocalhost);

  if (!secureEnough) {
    return { ok: false, rpId: normalizeRpId(rpIdInput ?? originHost), reason: "Origin is not a secure context" };
  }

  // rpId defaults to origin host
  const rpId = normalizeRpId(rpIdInput ?? originHost);
  if (!rpId) return { ok: false, rpId, reason: "rpId is empty" };

  // rpId must be a bare hostname (no scheme/port/path)
  if (/[/:@]/.test(rpId)) {
    return { ok: false, rpId, reason: "rpId must be a hostname only (no scheme/port/path/userinfo)" };
  }

  const rpIdIsIP = net.isIP(rpId) !== 0;

  // If origin is an IP, rpId must match exactly (no suffix logic)
  if (originIsIP) {
    if (rpId !== originHost) {
      return { ok: false, rpId, reason: "For IP origins, rpId must exactly match the IP" };
    }
    return { ok: true, rpId };
  }

  // If rpId is an IP but origin isn't, reject (doesn't make sense in WebAuthn’s model)
  if (rpIdIsIP) {
    return { ok: false, rpId, reason: "rpId cannot be an IP if origin host is a domain" };
  }

  // Same host or suffix-of host (domain boundary)
  if (!(rpId === originHost || originHost.endsWith("." + rpId))) {
    return { ok: false, rpId, reason: "rpId is not equal to or a suffix of the origin hostname" };
  }

  // Reject public suffix rpIds (PSL required for correctness)
  if (opts.isPublicSuffix) {
    if (opts.isPublicSuffix(rpId)) {
      return { ok: false, rpId, reason: "rpId is a public suffix (eTLD), which is not allowed" };
    }
  } else {
    // Conservative fallback: reject single-label rpIds except localhost.
    // This is NOT PSL-correct (e.g. "co.uk" still has a dot), but it blocks obvious footguns like "com".
    if (!rpId.includes(".") && rpId !== "localhost") {
      return { ok: false, rpId, reason: "rpId looks like a public suffix/single-label domain (no PSL check provided)" };
    }
  }

  return { ok: true, rpId };
}

function normalizeHost(hostname: string): string {
  // URL.hostname is already sans brackets/port, but normalize trailing dot + IDN
  const h = (hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  // Convert unicode → punycode ASCII (domainToASCII returns "" for invalid)
  return domainToASCII(h) || "";
}

function normalizeRpId(rpId: string): string {
  return normalizeHost(rpId);
}

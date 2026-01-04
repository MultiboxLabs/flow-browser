type RpIdCheckOptions = {
  /**
   * If true, allow http://localhost (and http://127.0.0.1 etc if you want)
   * like browsers do for local development.
   */
  allowInsecureLocalhost?: boolean;

  /**
   * Return true if `domain` is a public suffix (eTLD), e.g. "com", "co.uk".
   * This is what prevents rpId = "com" from being accepted.
   *
   * Plug in a PSL-based checker (recommended).
   */
  isPublicSuffix?: (domain: string) => boolean;

  /**
   * Optional stricter hostname validation. If omitted, a reasonable default is used.
   */
  isValidDomainLabel?: (label: string) => boolean;
};

type RpIdCheckResult = {
  ok: boolean;
  rpId: string;
  reason?: string;
};

export function isRpIdAllowed(origin: string, rpIdInput?: string, options: RpIdCheckOptions = {}): RpIdCheckResult {
  const { allowInsecureLocalhost = true, isPublicSuffix, isValidDomainLabel = defaultIsValidDomainLabel } = options;

  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return { ok: false, rpId: "", reason: "Invalid origin URL" };
  }

  const scheme = url.protocol.toLowerCase();
  const host = normalizeHost(url.hostname);
  if (!host) return { ok: false, rpId: "", reason: "Origin has no hostname" };

  // Secure-context-ish gate (approximation of browser behavior)
  const isLocalhostLike = host === "localhost" || isIpLiteral(host);
  const secureEnough =
    scheme === "https:" || scheme === "wss:" || (allowInsecureLocalhost && scheme === "http:" && isLocalhostLike);

  if (!secureEnough) {
    return { ok: false, rpId: normalizeHost(rpIdInput ?? host), reason: "Origin is not a secure context" };
  }

  // rpId defaults to the origin host
  const rpId = normalizeHost(rpIdInput ?? host);
  if (!rpId) return { ok: false, rpId, reason: "rpId is empty" };

  // rpId must be a host name only (no port, no scheme)
  if (rpId.includes(":") || rpId.includes("/") || rpId.includes("@")) {
    return { ok: false, rpId, reason: "rpId must be a hostname only (no scheme/port/path/userinfo)" };
  }

  // If the origin is an IP, rpId must match exactly (no suffix logic)
  if (isIpLiteral(host)) {
    if (rpId !== host) return { ok: false, rpId, reason: "For IP origins, rpId must exactly match the IP" };
    return { ok: true, rpId };
  }

  // Basic hostname / domain sanity checks (ASCII-ish; punycode domains are fine)
  if (!isValidHostname(rpId, isValidDomainLabel)) {
    return { ok: false, rpId, reason: "rpId is not a valid hostname" };
  }

  // Must be same host or a registrable suffix of the origin host
  if (!(rpId === host || host.endsWith("." + rpId))) {
    return { ok: false, rpId, reason: "rpId is not equal to or a suffix of the origin hostname" };
  }

  // Prevent rpId being a public suffix like "com" / "co.uk"
  // (needs PSL data; if you don't provide it, we do a conservative fallback)
  if (isPublicSuffix) {
    if (isPublicSuffix(rpId)) {
      return { ok: false, rpId, reason: "rpId is a public suffix (eTLD), which is not allowed" };
    }
  } else {
    // Fallback: reject single-label rpIds except localhost (not PSL-correct, but avoids obvious footguns)
    if (!rpId.includes(".") && rpId !== "localhost") {
      return {
        ok: false,
        rpId,
        reason: "rpId looks like a public suffix or single-label domain (PSL check not provided)"
      };
    }
  }

  return { ok: true, rpId };
}

/** Lowercase + strip trailing dot (DNS absolute form) */
function normalizeHost(h: string): string {
  return (h ?? "").trim().toLowerCase().replace(/\.$/, "");
}

function isIpLiteral(host: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const parts = host.split(".").map(Number);
    return parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255);
  }
  // IPv6 (URL.hostname gives it without brackets)
  return /^[0-9a-f:]+$/i.test(host) && host.includes(":");
}

function isValidHostname(hostname: string, isValidLabel: (label: string) => boolean): boolean {
  if (hostname.length > 253) return false;
  const labels = hostname.split(".");
  if (labels.some((l) => l.length === 0)) return false;
  return labels.every(isValidLabel);
}

function defaultIsValidDomainLabel(label: string): boolean {
  // Accept punycode ("xn--..."), digits, hyphen. Disallow leading/trailing hyphen.
  // (Browsers accept IDN via punycode at this stage; URL() already normalizes.)
  if (label.length < 1 || label.length > 63) return false;
  if (label.startsWith("-") || label.endsWith("-")) return false;
  return /^[a-z0-9-]+$/.test(label);
}

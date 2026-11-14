export function normalizeNavigationUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    try {
      return new URL(`https://${value}`);
    } catch {
      return null;
    }
  }
}

export function isAllowedProtocol(url: URL): boolean {
  return ["http:", "https:"].includes(url.protocol.toLowerCase());
}

export function normalizeAndValidateUrl(value: string): string | null {
  const url = normalizeNavigationUrl(value);
  if (!url) {
    return null;
  }

  if (!isAllowedProtocol(url)) {
    return null;
  }

  return url.toString();
}

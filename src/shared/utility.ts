export function getOriginFromURL(url: string): string {
  try {
    const urlObject = new URL(url);
    const protocol = urlObject.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return urlObject.hostname;
    }
    return urlObject.origin;
  } catch {
    return url;
  }
}

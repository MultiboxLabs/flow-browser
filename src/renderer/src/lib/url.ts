import { createSearchUrl } from "@/lib/search";

// Real Target Protocol -> Fake Browser Protocol
const protocolReplacements = {
  "chrome-extension://": "extension://"
};

export function getURLFromInput(input: string): string | null {
  // Trim whitespace
  const trimmedInput = input.trim();

  // Check if input is empty
  if (!trimmedInput) return null;

  // Check if its other protocols
  for (const [key, value] of Object.entries(protocolReplacements)) {
    if (trimmedInput.startsWith(value)) {
      return trimmedInput.replace(new RegExp(`^${value}`), key);
    }
  }

  // Check for protocol pattern (anything followed by ://)
  const protocolRegex = /^[a-zA-Z0-9.+-]+:\/\//;
  if (protocolRegex.test(trimmedInput)) {
    return trimmedInput;
  }

  // Check if it is parsable
  const url = URL.parse(input);
  if (url) {
    return url.toString();
  }

  // Check if it looks like a URL using a more robust regex pattern
  // This regex checks for domain patterns like example.com, sub.example.co.uk, etc.
  const urlRegex = /^([-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))$/;
  // If the input is a valid URL, return it
  if (urlRegex.test(trimmedInput)) {
    return `http://${trimmedInput}`;
  }

  return null;
}

export function isInputURL(input: string): boolean {
  return getURLFromInput(input) !== null;
}

export function parseAddressBarInput(input: string): string {
  // Trim whitespace
  const trimmedInput = input.trim();

  // Check if input is empty
  if (!trimmedInput) return "";

  // Parse as URL
  const url = getURLFromInput(input);
  if (url) {
    return url;
  }

  // Treat as search query
  return createSearchUrl(trimmedInput);
}

export function transformUrl(url: string): string | null {
  const urlObject = URL.parse(url);

  // Error Page (flow://error)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "error") {
    const erroredURL = urlObject.searchParams.get("url");
    if (erroredURL) {
      return erroredURL;
    } else {
      return "";
    }
  }

  // New Tab Page (flow://new-tab)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "new-tab") {
    return "";
  }

  // PDF Viewer (flow://pdf-viewer)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "pdf-viewer") {
    return urlObject.searchParams.get("url") ?? "";
  }

  // Other Protocols
  for (const [key, value] of Object.entries(protocolReplacements)) {
    if (url.startsWith(key)) {
      return url.replace(new RegExp(`^${key}`), value);
    }
  }

  return null;
}

export function simplifyUrl(url: string): string {
  const parsedUrl = URL.parse(url);
  if (!parsedUrl) {
    return url;
  }

  let hostname = parsedUrl.hostname;
  if (hostname.startsWith("www.")) {
    hostname = hostname.slice(4);
  }

  let shortenedURL = hostname;

  const isHttp = ["http:", "https:"].includes(parsedUrl.protocol);
  if (isHttp) {
    return shortenedURL;
  } else if (!isHttp && parsedUrl.hostname) {
    parsedUrl.pathname = "";
    parsedUrl.search = "";
    parsedUrl.hash = "";
    shortenedURL = parsedUrl.toString();
  }

  return parsedUrl.toString();
}

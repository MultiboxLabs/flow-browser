// Real Target Protocol -> Fake Browser Protocol
const protocolReplacements = {
  "chrome-extension://": "extension://",
  "chrome://": "flow://"
};

// URLs that should not transform to flow://
// Prefix these with chrome:// to open them in the browser
// e.g. chrome://gpu
const CHROME_PROTOCOL_WHITELIST = [
  "gpu",
  "tracing",
  "webrtc-internals",
  "media-internals",
  "blob-internals",
  "accessibility",
  "process-internals"
];

export function transformPotentialDisplayUrlToUrl(url: string): string | null {
  // chrome:// -> flow:// (for most cases)
  // without this case, it will try to transform every flow:// URL to chrome://, which we can't have.
  const urlObject = URL.parse(url);
  if (urlObject && ["chrome:", "flow:"].includes(urlObject.protocol)) {
    if (CHROME_PROTOCOL_WHITELIST.includes(urlObject.hostname)) {
      urlObject.protocol = "chrome:";
    } else {
      urlObject.protocol = "flow:";
    }
    return urlObject.toString();
  }

  for (const [key, value] of Object.entries(protocolReplacements)) {
    if (url.startsWith(value)) {
      return url.replace(new RegExp(`^${value}`), key);
    }
  }

  return null;
}

// TODO: Legacy function, remove
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

export function transformUrlToDisplayURL(url: string, allowEmpty: boolean = true): string | null {
  const urlObject = URL.parse(url);

  // Error Page (flow://error)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "error") {
    const erroredURL = urlObject.searchParams.get("url");
    if (erroredURL) {
      return transformUrlToDisplayURL(erroredURL, allowEmpty) ?? erroredURL;
    } else {
      return null;
    }
  }

  // New Tab Page (flow://new-tab)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "new-tab") {
    if (allowEmpty) {
      return "";
    }
  }

  // PDF Viewer (flow://pdf-viewer)
  if (urlObject && urlObject.protocol === "flow:" && urlObject.hostname === "pdf-viewer") {
    const pdfURL = urlObject.searchParams.get("url");
    if (pdfURL) {
      return transformUrlToDisplayURL(pdfURL, allowEmpty) ?? pdfURL;
    } else {
      return null;
    }
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

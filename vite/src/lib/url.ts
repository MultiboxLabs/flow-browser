const extensionId = chrome.runtime.id;
const fakeBrowserProtocol = "flow";
const whitelistedPages = ["new"];

// Real Target Protocol -> Fake Browser Protocol
const protocolReplacements = {
  "chrome-extension://": "extension://",
  [`${fakeBrowserProtocol}://`]: `chrome://`
};

const SEARCH_ENGINE = "https://www.google.com/search?q=%s";
export function parseAddressBarInput(input: string): string {
  // Trim whitespace
  const trimmedInput = input.trim();

  // Check if input is empty
  if (!trimmedInput) return "";

  // Check for common protocols
  const commonProtocols = [
    "http://",
    "https://",
    "chrome-extension://",
    "file://",
    "ftp://",
    "mailto:",
    "tel:",
    "data:"
  ];

  for (const protocol of commonProtocols) {
    if (trimmedInput.startsWith(protocol)) {
      return trimmedInput;
    }
  }

  // Check if it looks like a URL using a more robust regex pattern
  // This regex checks for domain patterns like example.com, sub.example.co.uk, etc.
  const urlRegex = /^([-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&//=]*))$/;
  // If the input is a valid URL, return it
  if (urlRegex.test(trimmedInput)) {
    return `http://${trimmedInput}`;
  }

  // Check if it looks like a main UI URL (flow://main or flow://new)
  if (trimmedInput.startsWith(`${fakeBrowserProtocol}://`)) {
    // return `chrome-extension://<extensionId>/[page]/index.html`
    const page = trimmedInput.replace(`${fakeBrowserProtocol}://`, "");
    if (whitelistedPages.includes(page)) {
      return `chrome-extension://${extensionId}/${page}/index.html`;
    }
  }

  // Check if its other protocols
  for (const [key, value] of Object.entries(protocolReplacements)) {
    if (trimmedInput.startsWith(value)) {
      return trimmedInput.replace(new RegExp(`^${value}`), key);
    }
  }

  // Treat as search query
  return SEARCH_ENGINE.replace("%s", encodeURIComponent(trimmedInput));
}

export function transformUrl(url: string): string | null {
  // Flow Protocol
  if (url.startsWith(`chrome-extension://${extensionId}/`)) {
    const path = url.split("/").slice(3).join("/");
    // Extract the first part of the path
    const firstPathSegment = path.split("/")[0];
    if (firstPathSegment && whitelistedPages.includes(firstPathSegment)) {
      return `${fakeBrowserProtocol}://${firstPathSegment}`;
    }
  }

  // Error Page
  const urlObject = new URL(url);
  if (urlObject.protocol === "flow-utility:" && urlObject.host === "page" && urlObject.pathname === "/error") {
    const erroredURL = urlObject.searchParams.get("url");
    if (erroredURL) {
      return erroredURL;
    } else {
      return "";
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

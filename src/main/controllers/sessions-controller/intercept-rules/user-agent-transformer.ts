import { transformUserAgentHeader } from "@/modules/user-agent";
import { createBetterWebRequest } from "@/controllers/sessions-controller/web-requests";
import type { Session } from "electron";
import { generateChromeValidationHeader } from "@/modules/chrome";

function generateBrowserClientHeaders(userAgent: string): Record<string, string> {
  const year = new Date().getFullYear();
  const BROWSER_CLIENT_HEADERS = {
    "x-browser-channel": "stable",
    "x-browser-copyright": `Copyright ${year} Google LLC. All Rights reserved.`,
    "x-browser-year": year.toString()
  };

  const validationHeader = generateChromeValidationHeader(userAgent);
  if (validationHeader) {
    BROWSER_CLIENT_HEADERS["x-browser-validation"] = validationHeader;
  }

  return BROWSER_CLIENT_HEADERS;
}

export function setupUserAgentTransformer(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "user-agent-transformer");

  webRequest.onBeforeSendHeaders((details, callback) => {
    let updated = false;

    const url = URL.parse(details.url);

    const requestHeaders = details.requestHeaders;
    const newHeaders = { ...requestHeaders };
    for (const header of Object.keys(requestHeaders)) {
      if (header.toLowerCase() == "user-agent") {
        const oldValue = requestHeaders[header];
        const { userAgent: newValue, includeChromeBrowserHeaders } = transformUserAgentHeader(oldValue, url);
        if (oldValue !== newValue) {
          newHeaders[header] = newValue;
          updated = true;
        }

        if (includeChromeBrowserHeaders) {
          for (const [key, value] of Object.entries(generateBrowserClientHeaders(newValue))) {
            newHeaders[key] = value;
          }
          updated = true;
        }
      }
    }

    if (updated) {
      callback({ requestHeaders: newHeaders });
    } else {
      callback({});
    }
  });
}

import { addPdfResponseToCache } from "@/browser/utility/protocols/_protocols/flow";
import { createBetterWebRequest } from "@/browser/utility/web-requests";
import { generateID } from "@/modules/utils";
import { getSettingValueById } from "@/saving/settings";
import { Session } from "electron";
import { URL } from "url";
import { transformUserAgentHeader } from "@/browser/utility/user-agent";

function setupUserAgentTransformer(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "user-agent-transformer");

  webRequest.onBeforeSendHeaders((details, callback) => {
    let updated = false;

    const url = URL.parse(details.url);

    const requestHeaders = details.requestHeaders;
    const newHeaders = { ...requestHeaders };
    for (const header of Object.keys(requestHeaders)) {
      if (header.toLowerCase() == "user-agent") {
        newHeaders[header] = transformUserAgentHeader(url, requestHeaders[header]);
        updated = true;
      }
    }

    if (updated) {
      callback({ requestHeaders: newHeaders });
    } else {
      callback({});
    }
  });
}

function setupCorsBypassForFlowProtocols(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "bypass-cors");

  const WHITELISTED_PROTOCOLS = ["flow:", "flow-internal:"];

  webRequest.onHeadersReceived((details, callback) => {
    const currentUrl = details.webContents?.getURL();
    const protocol = URL.parse(currentUrl ?? "")?.protocol;

    if (protocol && WHITELISTED_PROTOCOLS.includes(protocol)) {
      const newResponseHeaders = { ...details.responseHeaders };

      // Remove all Access-Control-Allow-Origin headers in different cases
      for (const header of Object.keys(newResponseHeaders)) {
        if (header.toLowerCase() == "access-control-allow-origin") {
          newResponseHeaders[header] = [];
        }
      }

      // Add the Access-Control-Allow-Origin header back with a wildcard
      newResponseHeaders["Access-Control-Allow-Origin"] = ["*"];

      callback({ responseHeaders: newResponseHeaders });
      return;
    }

    callback({});
  });
}

function setupBetterPdfViewer(session: Session) {
  const webRequest = createBetterWebRequest(session.webRequest, "better-pdf-viewer");

  // Fetch the PDF first. If it is a PDF, save it to temp and redirect to better PDF viewer
  webRequest.onBeforeRequest(
    {
      urls: ["<all_urls>"],
      types: ["mainFrame", "subFrame"]
    },
    async (details, callback) => {
      const url = details.url;
      const urlObject = URL.parse(url);
      if (!urlObject) {
        return callback({});
      }

      const { pathname } = urlObject;
      if (pathname && pathname.toLowerCase().endsWith(".pdf") && getSettingValueById("enableFlowPdfViewer") === true) {
        const response = await session.fetch(url).catch(() => null);
        if (!response) {
          return callback({});
        }

        // Check if the response is a PDF
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/pdf")) {
          return callback({});
        }

        // Save the PDF to a temp file
        const cacheKey = generateID();
        addPdfResponseToCache(cacheKey, response);

        // Construct the local file URL
        const localFileURL = new URL("flow://pdf-cache");
        localFileURL.searchParams.set("url", url);
        localFileURL.searchParams.set("key", cacheKey);

        // Redirect to PDF viewer with the local file path
        const viewerURL = new URL("flow://pdf-viewer");
        viewerURL.searchParams.set("url", url);
        viewerURL.searchParams.set("cacheURL", localFileURL.toString());

        return callback({ redirectURL: viewerURL.toString() });
      }

      callback({});
    }
  );
}

// Setup intercept rules for the session
export function setupInterceptRules(session: Session) {
  // Transform the User-Agent header
  setupUserAgentTransformer(session);

  // Bypass CORS for flow and flow-internal protocols
  setupCorsBypassForFlowProtocols(session);

  // Setup redirects required for the better PDF viewer
  setupBetterPdfViewer(session);
}

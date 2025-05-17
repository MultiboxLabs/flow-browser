import { createBetterWebRequest } from "@/browser/utility/web-requests";
import { getSettingValueById } from "@/saving/settings";
import { Session } from "electron";

// Bypass CORS for flow and flow-internal protocols
function setupCorsBypassForFlowProtocols(session: Session) {
  const bypassCorsWebRequest = createBetterWebRequest(session.webRequest, "bypass-cors");

  const WHITELISTED_PROTOCOLS = ["flow:", "flow-internal:"];

  bypassCorsWebRequest.onHeadersReceived((details, callback) => {
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

// Setup redirects required for the better PDF viewer
function setupBetterPdfViewer(session: Session) {
  const betterPdfViewerWebRequest = createBetterWebRequest(session.webRequest, "better-pdf-viewer");

  // Redirect to better PDF viewer
  betterPdfViewerWebRequest.onBeforeRequest(
    {
      urls: ["<all_urls>"],
      types: ["mainFrame", "subFrame"]
    },
    (details, callback) => {
      const url = details.url;
      const urlObject = URL.parse(url);
      if (!urlObject) {
        return callback({});
      }

      const { pathname } = urlObject;
      if (pathname.toLowerCase().endsWith(".pdf") && getSettingValueById("enableFlowPdfViewer") === true) {
        const viewerURL = new URL("flow://pdf-viewer");
        viewerURL.searchParams.set("url", url);
        return callback({ redirectURL: viewerURL.toString() });
      }

      callback({});
    }
  );

  // Update Origin header to requests
  betterPdfViewerWebRequest.onBeforeSendHeaders((details, callback) => {
    const url = details.url;
    const urlObject = URL.parse(url);
    if (!urlObject) {
      return callback({});
    }

    const newHeaders = { ...details.requestHeaders, Origin: urlObject.origin };
    callback({ requestHeaders: newHeaders });
  });
}

// Setup intercept rules for the session
export function setupInterceptRules(session: Session) {
  // Bypass CORS for flow and flow-internal protocols
  setupCorsBypassForFlowProtocols(session);

  // Setup redirects required for the better PDF viewer
  setupBetterPdfViewer(session);
}

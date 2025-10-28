import { createBetterWebRequest } from "@/controllers/sessions-controller/web-requests";
import type { Session } from "electron";

/**
 * Setup CORS bypass for whitelisted protocols
 * @param session
 */
export function setupCorsBypassForCustomProtocols(session: Session) {
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

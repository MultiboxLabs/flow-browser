import { transformUserAgentHeader } from "@/modules/user-agent";
import { createBetterWebRequest } from "@/controllers/sessions-controller/web-requests";
import type { Session } from "electron";

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
        const newValue = transformUserAgentHeader(oldValue, url);
        if (oldValue !== newValue) {
          newHeaders[header] = newValue;
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

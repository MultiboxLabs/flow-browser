import { FLAGS } from "@/modules/flags";
import { app } from "electron";

const EDGE_USER_AGENT = "Edg/136.0.3240.76";

export function transformUserAgentHeader(userAgent: string, url: URL | null) {
  if (!FLAGS.SCRUBBED_USER_AGENT) {
    return userAgent;
  }

  const addEdgeUserAgent = true;
  const removeElectronUserAgent = true;
  const removeAppUserAgent = false;

  if (url) {
    // const hostname = url.hostname.toLowerCase();
    // if (hostname === "accounts.google.com") {
    // }
  }

  if (removeElectronUserAgent) {
    userAgent = userAgent.replace(/\sElectron\/\S+/, "");
  }

  if (removeAppUserAgent) {
    const appName = app.getName();
    userAgent = userAgent.replace(new RegExp(`\\s${appName}/\\S+`, "i"), "");
  }

  const hasEdgeUserAgent = userAgent.includes(EDGE_USER_AGENT);
  if (addEdgeUserAgent && !hasEdgeUserAgent) {
    userAgent = `${userAgent} ${EDGE_USER_AGENT}`;
  }

  return userAgent;
}

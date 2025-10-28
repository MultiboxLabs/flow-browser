import { FLAGS } from "@/modules/flags";
import { app } from "electron";

const EDGE_USER_AGENT = "Edg/136.0.3240.76";

export function transformUserAgentHeader(userAgent: string, url: URL | null) {
  if (!FLAGS.SCRUBBED_USER_AGENT) {
    return userAgent;
  }

  // Edge User Agent:
  // - Causes a few issues with Google Auth
  const addEdgeUserAgent = false;

  // Remove Electron User Agent:
  // - Causes issues with Spotify
  const removeElectronUserAgent = true;

  // Remove App User Agent:
  // - Flow will be less identifiable
  let removeAppUserAgent = false;

  if (url) {
    const hostname = url.hostname.toLowerCase();

    // WhatsApp does not like the 'Flow' User Agent
    // Removing it fixes the issue and finally lets us use https://web.whatsapp.com/
    if (hostname.endsWith(".whatsapp.com")) {
      removeAppUserAgent = true;
    }
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

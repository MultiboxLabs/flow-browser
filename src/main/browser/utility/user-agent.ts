const appName = "Flow";

const EDGE_USER_AGENT = "Edg/136.0.3240.76";

export function transformUserAgentHeader(url: URL | null, userAgent: string) {
  let addEdgeUserAgent = false;
  let removeElectronUserAgent = false;
  let removeAppUserAgent = false;

  if (url) {
    const hostname = url.hostname.toLowerCase();
    if (hostname === "accounts.google.com") {
      addEdgeUserAgent = false;
      removeElectronUserAgent = true;
      removeAppUserAgent = false;
    }
    if (hostname.endsWith("spotify.com") || hostname.endsWith("spotifycdn.com")) {
      addEdgeUserAgent = false;
      removeElectronUserAgent = true;
      removeAppUserAgent = false;
    }
  }

  if (removeElectronUserAgent) {
    userAgent = userAgent.replace(/\sElectron\/\S+/, "");
  }

  if (removeAppUserAgent) {
    userAgent = userAgent.replace(new RegExp(`\\s${appName}/\\S+`, "i"), "");
  }

  if (addEdgeUserAgent) {
    userAgent = `${userAgent} ${EDGE_USER_AGENT}`;
  }

  return userAgent;
}

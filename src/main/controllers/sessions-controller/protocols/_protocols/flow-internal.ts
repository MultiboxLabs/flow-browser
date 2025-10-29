import { AllowedDomains, serveStaticFile } from "../utils";
import type { Protocol } from "electron";
import { tabsController } from "@/controllers/tabs-controller";

const FLOW_INTERNAL_ALLOWED_DOMAINS: AllowedDomains = {
  "main-ui": true,
  "popup-ui": true,
  settings: true,
  omnibox: true,
  "glance-modal": true,
  onboarding: true
};

const activeTabFaviconCache = new Map<number, [string, Response]>();

// Remove cached favicons that are no longer active
setInterval(() => {
  for (const [tabId, [cachedFaviconURL]] of activeTabFaviconCache.entries()) {
    const tab = tabsController.getTabById(tabId);
    if (!tab || tab.isDestroyed || tab.faviconURL !== cachedFaviconURL) {
      activeTabFaviconCache.delete(tabId);
    }
  }
}, 1000);

export function registerFlowInternalProtocol(protocol: Protocol) {
  const handleActiveFaviconRequest = async (_request: Request, url: URL) => {
    // Get the tab ID
    const tabId = url.searchParams.get("tabId");
    if (!tabId) {
      return new Response("No tab ID provided", { status: 400 });
    }

    // Parse the tab ID
    const tabIdInt = parseInt(tabId);
    if (isNaN(tabIdInt)) {
      return new Response("Invalid tab ID", { status: 400 });
    }

    // Get the tab
    const tab = tabsController.getTabById(tabIdInt);
    if (!tab) {
      return new Response("No tab found", { status: 404 });
    }

    // Get the favicon URL
    const faviconURL = tab.faviconURL;
    if (!faviconURL) {
      return new Response("No favicon found", { status: 404 });
    }

    // Get the profile
    const profile = tab.loadedProfile;
    if (!profile) {
      return new Response("No profile found", { status: 404 });
    }

    // Check if the favicon is already cached
    const cachedFaviconData = activeTabFaviconCache.get(tabIdInt);
    if (cachedFaviconData) {
      const [cachedFaviconURL, faviconResponse] = cachedFaviconData;
      if (cachedFaviconURL === faviconURL) {
        return faviconResponse.clone();
      }
    }

    // Fetch the favicon from the profile
    const faviconResponse = await profile.session.fetch(faviconURL);
    activeTabFaviconCache.set(tabIdInt, [faviconURL, faviconResponse]);
    return faviconResponse.clone();
  };

  const handleDomainRequest = async (request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_INTERNAL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_INTERNAL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir, undefined, request, {
      overrideRouteName: extraDir ? undefined : hostname
    });
  };

  protocol.handle("flow-internal", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow-internal://active-favicon/:path
    if (url.host === "active-favicon") {
      return await handleActiveFaviconRequest(request, url);
    }

    // flow-internal://:path
    return await handleDomainRequest(request, url);
  });
}

import { tabsController } from "@/controllers/tabs-controller";
import { HonoApp } from ".";

// Cache storing the fetched favicon ArrayBuffer per tab, keyed by tabId.
const activeTabFaviconCache = new Map<number, { faviconURL: string; data: ArrayBuffer; contentType: string }>();

// In-flight fetch promises, keyed by "tabId:faviconURL", to deduplicate
// concurrent requests for the same favicon (e.g. during sidebar resizing).
const inFlightFetches = new Map<string, Promise<{ data: ArrayBuffer; contentType: string }>>();

// Remove cached favicons that are no longer active
setInterval(() => {
  for (const [tabId, cached] of activeTabFaviconCache.entries()) {
    const tab = tabsController.getTabById(tabId);
    if (!tab || tab.isDestroyed || tab.faviconURL !== cached.faviconURL) {
      activeTabFaviconCache.delete(tabId);
    }
  }
}, 1000);

// Common Cache-Control header for favicon responses.
// The renderer URL includes faviconURL as a query param for cache-busting,
// so we can cache aggressively — Chromium will re-request with a new URL
// when the favicon actually changes.
const FAVICON_CACHE_HEADERS = {
  "Cache-Control": "max-age=300, immutable",
  "Content-Type": "image/png"
};

export function registerActiveFaviconRoutes(app: HonoApp) {
  app.get("/active-favicon", async (c) => {
    const tabId = c.req.query("tabId");
    if (!tabId) {
      return c.text("No tab ID provided", 400);
    }

    const tabIdInt = parseInt(tabId);
    if (isNaN(tabIdInt)) {
      return c.text("Invalid tab ID", 400);
    }

    const tab = tabsController.getTabById(tabIdInt);
    if (!tab) {
      return c.text("No tab found", 404);
    }

    const faviconURL = tab.faviconURL;
    if (!faviconURL) {
      return c.text("No favicon found", 404);
    }

    const profile = tab.loadedProfile;
    if (!profile) {
      return c.text("No profile found", 404);
    }

    // Check if the favicon is already cached (resolved data, not a Response stream)
    const cached = activeTabFaviconCache.get(tabIdInt);
    if (cached && cached.faviconURL === faviconURL) {
      return c.body(cached.data, 200, {
        ...FAVICON_CACHE_HEADERS,
        "Content-Type": cached.contentType
      });
    }

    // Deduplicate concurrent fetches for the same tab+favicon combination.
    // During sidebar resizing, many requests can arrive before the first one resolves.
    const dedupeKey = `${tabIdInt}:${faviconURL}`;
    let fetchPromise = inFlightFetches.get(dedupeKey);
    if (!fetchPromise) {
      fetchPromise = (async () => {
        const faviconResponse = await profile.session.fetch(faviconURL);
        const arrayBuffer = await faviconResponse.arrayBuffer();
        const contentType = faviconResponse.headers.get("Content-Type") || "image/png";
        return { data: arrayBuffer, contentType };
      })();
      inFlightFetches.set(dedupeKey, fetchPromise);
    }

    try {
      const { data, contentType } = await fetchPromise;

      // Store in cache as raw ArrayBuffer (can be reused without clone/stream issues)
      activeTabFaviconCache.set(tabIdInt, { faviconURL, data, contentType });

      return c.body(data, 200, {
        ...FAVICON_CACHE_HEADERS,
        "Content-Type": contentType
      });
    } catch (error) {
      console.error(`Failed to fetch favicon for tab ${tabIdInt}:`, error);
      return c.text("Failed to fetch favicon", 500);
    } finally {
      inFlightFetches.delete(dedupeKey);
    }
  });
}

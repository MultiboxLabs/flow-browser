import { tabsController } from "@/controllers/tabs-controller";
import { HonoApp } from ".";

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

    // Check if the favicon is already cached
    const cachedFaviconData = activeTabFaviconCache.get(tabIdInt);
    if (cachedFaviconData) {
      const [cachedFaviconURL, faviconResponse] = cachedFaviconData;
      if (cachedFaviconURL === faviconURL) {
        return faviconResponse.clone();
      }
    }

    // Fetch the favicon from the profile
    try {
      const faviconResponse = await profile.session.fetch(faviconURL);
      activeTabFaviconCache.set(tabIdInt, [faviconURL, faviconResponse.clone()]);
      return faviconResponse;
    } catch (error) {
      console.error(`Failed to fetch favicon for tab ${tabIdInt}:`, error);
      return c.text("Failed to fetch favicon", 500);
    }
  });
}

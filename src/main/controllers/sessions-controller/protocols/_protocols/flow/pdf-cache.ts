import { getPdfResponseFromCache, removePdfResponseFromCache } from "@/modules/pdf-cache";
import { HonoApp } from ".";

export function registerPdfCacheRoutes(app: HonoApp) {
  app.get("/pdf-cache", async (c) => {
    const pdfURL = c.req.query("url");
    const key = c.req.query("key");
    if (!pdfURL || !key) {
      return c.text("Invalid request path", 400);
    }

    const pdfResponse = getPdfResponseFromCache(key);
    if (!pdfResponse) {
      // redirect to actual url
      return c.redirect(pdfURL);
    }

    removePdfResponseFromCache(key);
    return pdfResponse;
  });
}

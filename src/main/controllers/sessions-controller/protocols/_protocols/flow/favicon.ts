import { getFavicon, normalizeURL } from "@/modules/favicons";
import { HonoApp } from ".";
import { bufferToArrayBuffer } from "@/modules/utils";

export function registerFaviconRoutes(app: HonoApp) {
  app.get("/favicon", async (c) => {
    const targetUrl = c.req.query("url");
    if (!targetUrl) {
      return c.text("No URL provided", 400);
    }

    const normalizedTargetUrl = normalizeURL(targetUrl);
    const favicon = await getFavicon(normalizedTargetUrl);
    if (!favicon) {
      return c.text("No favicon found", 404);
    }

    return c.body(bufferToArrayBuffer(favicon), 200, { "Content-Type": "image/png" });
  });
}

import { registerFaviconRoutes } from "./favicon";
import { registerAssetsRoutes } from "./assets";
import { registerExtensionIconRoutes } from "./extension-icon";
import { registerPdfCacheRoutes } from "./pdf-cache";
import { transformPathForRequest } from "../../utils";
import { type Protocol } from "electron";
import { Hono } from "hono/tiny";
import { registerStaticDomainsRoutes } from "../../static-domains";

// Create Hono App
const app = new Hono({
  getPath: transformPathForRequest
});
export type HonoApp = typeof app;

// Register Routes
registerFaviconRoutes(app);
registerAssetsRoutes(app);
registerExtensionIconRoutes(app);
registerPdfCacheRoutes(app);

// Catch-all Route
registerStaticDomainsRoutes("flow", app);

// Export Protocol Handler
export function registerFlowProtocol(protocol: Protocol) {
  protocol.handle("flow", async (request) => {
    return app.fetch(request);
  });
}

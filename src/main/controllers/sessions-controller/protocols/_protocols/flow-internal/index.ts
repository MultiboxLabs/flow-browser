import { type Protocol } from "electron";
import { Hono } from "hono/tiny";
import { registerStaticDomainsRoutes } from "../../static-domains";
import { transformPathForRequest } from "../../utils";
import { registerActiveFaviconRoutes } from "./active-favicon";
import { registerTabSnapshotRoutes } from "./tab-snapshot";

// Create Hono App
const app = new Hono({
  getPath: transformPathForRequest
});
export type HonoApp = typeof app;

// Register Routes
registerActiveFaviconRoutes(app);
registerTabSnapshotRoutes(app);

// Catch-all Route
registerStaticDomainsRoutes("flow-internal", app);

// Export Protocol Handler
export function registerFlowInternalProtocol(protocol: Protocol) {
  protocol.handle("flow-internal", async (request) => {
    return app.fetch(request);
  });
}

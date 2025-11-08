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
// None currently

// Catch-all Route
registerStaticDomainsRoutes("flow-external", app);

// Export Protocol Handler
export function registerFlowExternalProtocol(protocol: Protocol) {
  protocol.handle("flow-external", async (request) => {
    return app.fetch(request);
  });
}

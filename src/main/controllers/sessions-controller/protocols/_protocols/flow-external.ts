import { AllowedDomains, serveStaticFile } from "../utils";
import type { Protocol } from "electron";

const FLOW_EXTERNAL_ALLOWED_DOMAINS: AllowedDomains = {
  // Dino Game - Taken from https://github.com/yell0wsuit/chrome-dino-enhanced
  "dino.chrome.game": "chrome-dino-game",

  // Surf Game (v1) - Taken From https://github.com/yell0wsuit/ms-edge-letssurf
  "v1.surf.edge.game": "edge-surf-game-v1",

  // Surf Game (v2) - Taken from https://github.com/yell0wsuit/ms-edge-surf-2
  "v2.surf.edge.game": "edge-surf-game-v2"
};

export function registerFlowExternalProtocol(protocol: Protocol) {
  const handleDomainRequest = async (request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_EXTERNAL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_EXTERNAL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir, undefined, request);
  };

  protocol.handle("flow-external", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow://:path
    return await handleDomainRequest(request, url);
  });
}

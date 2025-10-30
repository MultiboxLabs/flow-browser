import type { Hono } from "hono/tiny";
import type { Context } from "hono";
import { serveStaticFile } from "./utils";

type SubdirectoryActualDomainInfo = {
  type: "subdirectory";
  subdirectory: string;
};
type RoutedActualDomainInfo = {
  type: "route";
  route: string;
};

type ActualDomainInfo = SubdirectoryActualDomainInfo | RoutedActualDomainInfo;

type CustomProtocol = "flow" | "flow-internal" | "flow-external";

type DomainInfo = {
  protocol: CustomProtocol;
  hostname: string;
  actual: ActualDomainInfo;
};

const CUSTOM_DOMAINS: DomainInfo[] = [
  // flow-internal
  {
    protocol: "flow-internal",
    hostname: "main-ui",
    actual: {
      type: "route",
      route: "main-ui"
    }
  },
  {
    protocol: "flow-internal",
    hostname: "popup-ui",
    actual: {
      type: "route",
      route: "popup-ui"
    }
  },
  {
    protocol: "flow-internal",
    hostname: "settings",
    actual: {
      type: "route",
      route: "settings"
    }
  },
  {
    protocol: "flow-internal",
    hostname: "omnibox",
    actual: {
      type: "route",
      route: "omnibox"
    }
  },
  {
    protocol: "flow-internal",
    hostname: "onboarding",
    actual: {
      type: "route",
      route: "onboarding"
    }
  },

  // flow
  {
    protocol: "flow",
    hostname: "new-tab",
    actual: {
      type: "route",
      route: "new-tab"
    }
  },
  {
    protocol: "flow",
    hostname: "error",
    actual: {
      type: "route",
      route: "error"
    }
  },
  {
    protocol: "flow",
    hostname: "about",
    actual: {
      type: "route",
      route: "about"
    }
  },
  {
    protocol: "flow",
    hostname: "games",
    actual: {
      type: "route",
      route: "games"
    }
  },
  {
    protocol: "flow",
    hostname: "omnibox",
    actual: {
      type: "route",
      route: "omnibox-debug"
    }
  },
  {
    protocol: "flow",
    hostname: "extensions",
    actual: {
      type: "route",
      route: "extensions"
    }
  },
  {
    protocol: "flow",
    hostname: "pdf-viewer",
    actual: {
      type: "route",
      route: "pdf-viewer"
    }
  },

  // flow-external
  {
    protocol: "flow-external",
    // Dino Game - Taken from https://github.com/yell0wsuit/chrome-dino-enhanced
    hostname: "dino.chrome.game",
    actual: {
      type: "subdirectory",
      subdirectory: "chrome-dino-game"
    }
  },
  {
    protocol: "flow-external",
    // Surf Game (v1) - Taken From https://github.com/yell0wsuit/ms-edge-letssurf
    hostname: "v1.surf.edge.game",
    actual: {
      type: "subdirectory",
      subdirectory: "edge-surf-game-v1"
    }
  },
  {
    protocol: "flow-external",
    // Surf Game (v2) - Taken from https://github.com/yell0wsuit/ms-edge-surf-2
    hostname: "v2.surf.edge.game",
    actual: {
      type: "subdirectory",
      subdirectory: "edge-surf-game-v2"
    }
  }
];

export function registerDomainsRoutes(protocol: CustomProtocol, app: Hono) {
  const domainInfos = CUSTOM_DOMAINS.filter((domainInfo) => domainInfo.protocol === protocol);
  if (domainInfos.length === 0) {
    return;
  }

  const handler = async (c: Context) => {
    const domain = c.req.param("domain");
    const path = c.req.param("path") ?? "/";

    for (const domainInfo of domainInfos) {
      if (domainInfo.hostname !== domain) {
        continue;
      }

      const actualType = domainInfo.actual.type;
      if (actualType === "route") {
        return await serveStaticFile(path, undefined, undefined, c.req.raw, {
          overrideRouteName: domainInfo.actual.route
        });
      } else if (actualType === "subdirectory") {
        return await serveStaticFile(path, domainInfo.actual.subdirectory, undefined, c.req.raw);
      }
    }

    // Invalid domain, show error page
    // -300 is ERR_INVALID_URL (https://github.com/ccnokes/chrome-network-errors/blob/master/index.js)
    const errorPageURL = new URL("flow://error");
    errorPageURL.searchParams.set("errorCode", "-300");
    errorPageURL.searchParams.set("url", c.req.url);
    errorPageURL.searchParams.set("initial", "1");
    return c.redirect(errorPageURL.toString());
  };

  app.get("/:domain", handler);
  app.get("/:domain/:path{.+}", handler);
}

import type { StaticDomainInfo } from "./types";

export const STATIC_DOMAINS: StaticDomainInfo[] = [
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

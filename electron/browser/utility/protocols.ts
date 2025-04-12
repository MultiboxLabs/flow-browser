import path from "path";
import { app, protocol as protocolModule, Protocol, session, Session } from "electron";
import { PATHS } from "@/modules/paths";
import fsPromises from "fs/promises";
import { getContentType } from "@/modules/utils";
import { getFavicon, normalizeURL } from "@/modules/favicons";

protocolModule.registerSchemesAsPrivileged([
  {
    scheme: "flow-internal",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow",
    privileges: { standard: true, secure: true, bypassCSP: true, codeCache: true, supportFetchAPI: true }
  },
  {
    scheme: "flow-external",
    privileges: { standard: true, secure: true }
  }
]);

interface AllowedDomains {
  [key: string]: true | string;
}

const FLOW_INTERNAL_ALLOWED_DOMAINS: AllowedDomains = {
  main: true,
  settings: true,
  "glance-modal": true
};

const FLOW_PROTOCOL_ALLOWED_DOMAINS: AllowedDomains = {
  about: true,
  error: true,
  "new-tab": true,
  games: true
};

const FLOW_EXTERNAL_ALLOWED_DOMAINS: AllowedDomains = {
  // Dino Game - Taken from https://github.com/yell0wsuit/chrome-dino-enhanced
  "dino.chrome.game": "chrome-dino-game",

  // Surf Game (v1) - Taken From https://github.com/yell0wsuit/ms-edge-letssurf
  "v1.surf.edge.game": "edge-surf-game-v1",

  // Surf Game (v2) - Taken from https://github.com/yell0wsuit/ms-edge-surf-2
  "v2.surf.edge.game": "edge-surf-game-v2"
};

async function serveStaticFile(filePath: string, extraDir?: string, baseDir: string = PATHS.VITE_WEBUI) {
  let transformedPath = filePath;
  if (transformedPath.startsWith("/")) {
    transformedPath = transformedPath.slice(1);
  }
  if (transformedPath.endsWith("/")) {
    transformedPath = transformedPath.slice(0, -1);
  }

  if (!transformedPath) {
    return await serveStaticFile("index.html", extraDir, baseDir);
  }

  const transformedBaseDir = extraDir ? path.join(baseDir, extraDir) : baseDir;
  const fullFilePath = path.join(transformedBaseDir, transformedPath);

  try {
    const stats = await fsPromises.stat(fullFilePath);
    if (stats.isDirectory()) {
      return new Response("File not found", { status: 404 });
    }

    // Read file contents
    const buffer = await fsPromises.readFile(fullFilePath);

    // Determine content type based on file extension
    const contentType = getContentType(fullFilePath);

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return new Response("File not found", { status: 404 });
  }
}

function registerFlowInternalProtocol(protocol: Protocol) {
  const handleDomainRequest = async (_request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_INTERNAL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_INTERNAL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir);
  };

  protocol.handle("flow-internal", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow-internal://:path
    return await handleDomainRequest(request, url);
  });
}

function registerFlowProtocol(protocol: Protocol) {
  const handleDomainRequest = async (_request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_PROTOCOL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_PROTOCOL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir);
  };

  const handleFaviconRequest = async (request: Request, url: URL) => {
    const targetUrl = url.searchParams.get("url");
    if (!targetUrl) {
      return new Response("No URL provided", { status: 400 });
    }

    const normalizedTargetUrl = normalizeURL(targetUrl);

    const favicon = await getFavicon(normalizedTargetUrl);
    if (!favicon) {
      return new Response("No favicon found", { status: 404 });
    }

    return new Response(favicon, {
      headers: { "Content-Type": "image/png" }
    });
  };

  const handleAssetRequest = async (request: Request, url: URL) => {
    const assetPath = url.pathname;

    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(assetPath).replace(/^(\.\.(\/|\\|$))+/, "");

    const filePath = path.join(PATHS.ASSETS, "public", normalizedPath);

    // Ensure the requested path is within the allowed directory
    const assetsDir = path.normalize(path.join(PATHS.ASSETS, "public"));
    if (!path.normalize(filePath).startsWith(assetsDir)) {
      return new Response("Access denied", { status: 403 });
    }

    try {
      // Read file contents
      const buffer = await fsPromises.readFile(filePath);

      // Determine content type based on file extension
      const contentType = getContentType(filePath);

      return new Response(buffer, {
        headers: {
          "Content-Type": contentType
        }
      });
    } catch (error) {
      console.error("Error serving asset:", error);
      return new Response("Asset not found", { status: 404 });
    }
  };

  protocol.handle("flow", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow://favicon/:path
    if (url.host === "favicon") {
      return await handleFaviconRequest(request, url);
    }

    // flow://asset/:path
    if (url.host === "asset") {
      return await handleAssetRequest(request, url);
    }

    // flow://:path
    return await handleDomainRequest(request, url);
  });
}

function registerFlowExternalProtocol(protocol: Protocol) {
  const handleDomainRequest = async (_request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_EXTERNAL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_EXTERNAL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir);
  };

  protocol.handle("flow-external", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow://:path
    return await handleDomainRequest(request, url);
  });
}

export function registerProtocolsWithSession(session: Session) {
  const protocol = session.protocol;
  registerFlowProtocol(protocol);
  registerFlowExternalProtocol(protocol);
}

app.whenReady().then(() => {
  const defaultSession = session.defaultSession;

  registerProtocolsWithSession(defaultSession);
  registerFlowInternalProtocol(defaultSession.protocol);

  defaultSession.registerPreloadScript({
    id: "flow-preload",
    type: "frame",
    filePath: PATHS.PRELOAD
  });
});

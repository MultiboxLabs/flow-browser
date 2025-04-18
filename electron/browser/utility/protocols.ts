import path from "path";
import { app, protocol as protocolModule, Protocol, session, Session, net, protocol } from "electron";
import { PATHS } from "@/modules/paths";
import fsPromises from "fs/promises";
import { getContentType } from "@/modules/utils";
import { getFavicon, normalizeURL } from "@/modules/favicons";
import { FLAGS } from "@/modules/flags";
import { isDevelopmentServerRunning, setupHotReloadFileDescriptors, fetchFromDevServer } from "./hot-reload";

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
  omnibox: true,
  "glance-modal": true,
  onboarding: true
};

const FLOW_PROTOCOL_ALLOWED_DOMAINS: AllowedDomains = {
  about: true,
  error: true,
  "new-tab": true,
  games: true,
  omnibox: true
};

const FLOW_EXTERNAL_ALLOWED_DOMAINS: AllowedDomains = {
  // Dino Game - Taken from https://github.com/yell0wsuit/chrome-dino-enhanced
  "dino.chrome.game": "chrome-dino-game",

  // Surf Game (v1) - Taken From https://github.com/yell0wsuit/ms-edge-letssurf
  "v1.surf.edge.game": "edge-surf-game-v1",

  // Surf Game (v2) - Taken from https://github.com/yell0wsuit/ms-edge-surf-2
  "v2.surf.edge.game": "edge-surf-game-v2"
};

async function serveStaticFile(
  filePath: string,
  extraDir?: string,
  baseDir: string = PATHS.VITE_WEBUI,
  request?: Request
) {
  let transformedPath = filePath;
  if (transformedPath.startsWith("/")) {
    transformedPath = transformedPath.slice(1);
  }
  if (transformedPath.endsWith("/")) {
    transformedPath = transformedPath.slice(0, -1);
  }

  if (!transformedPath) {
    return await serveStaticFile("index.html", extraDir, baseDir, request);
  }

  if (extraDir) {
    transformedPath = path.join(extraDir, transformedPath);
  }

  const fullFilePath = path.join(baseDir, transformedPath);

  // Attempt to serve the file from development server if we're not packaged
  if (FLAGS.DEBUG_HOT_RELOAD_FRONTEND && baseDir === PATHS.VITE_WEBUI && !app.isPackaged) {
    setupHotReloadFileDescriptors();

    // Make sure the development server is running
    const ping = await isDevelopmentServerRunning();

    if (ping) {
      return await fetchFromDevServer(transformedPath, request);
    }
  }

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
  const handleDomainRequest = async (request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_INTERNAL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_INTERNAL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir, undefined, request);
  };

  protocol.handle("flow-internal", async (request) => {
    const urlString = request.url;
    const url = new URL(urlString);

    // flow-internal://:path
    return await handleDomainRequest(request, url);
  });
}

function registerFlowProtocol(protocol: Protocol) {
  const handleDomainRequest = async (request: Request, url: URL) => {
    const hostname = url.hostname;
    const pathname = url.pathname;

    if (!(hostname in FLOW_PROTOCOL_ALLOWED_DOMAINS)) {
      return new Response("Invalid request path", { status: 400 });
    }

    const allowedPath = FLOW_PROTOCOL_ALLOWED_DOMAINS[hostname];
    const extraDir = allowedPath === true ? undefined : allowedPath;
    return await serveStaticFile(pathname, extraDir, undefined, request);
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

// Bypass CORS for flow and flow-internal protocols
function bypassCORS(session: Session) {
  const WHITELISTED_PROTOCOLS = ["flow:", "flow-internal:"];

  session.webRequest.onHeadersReceived((details, callback) => {
    const currentUrl = details.webContents?.getURL();
    // @ts-ignore: URL.parse should work, but tsc thinks it doesn't
    const protocol = URL.parse(currentUrl ?? "")?.protocol;

    if (protocol && WHITELISTED_PROTOCOLS.includes(protocol)) {
      const newResponseHeaders = { ...details.responseHeaders };

      // Remove all Access-Control-Allow-Origin headers in different cases
      for (const header of Object.keys(newResponseHeaders)) {
        if (header.toLowerCase() == "access-control-allow-origin") {
          newResponseHeaders[header] = [];
        }
      }

      // Add the Access-Control-Allow-Origin header back with a wildcard
      newResponseHeaders["Access-Control-Allow-Origin"] = ["*"];

      callback({ responseHeaders: newResponseHeaders });
      return;
    }

    callback({});
  });
}

export function registerProtocolsWithSession(session: Session) {
  const protocol = session.protocol;
  registerFlowProtocol(protocol);
  registerFlowExternalProtocol(protocol);

  bypassCORS(session);
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

  bypassCORS(defaultSession);
});

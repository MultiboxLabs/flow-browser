import { AllowedDomains, serveStaticFile } from "@/browser/utility/protocols/utils";
import { browser } from "@/browser";
import { getExtensionIcon } from "@/modules/extensions/management";
import { getFavicon, normalizeURL } from "@/modules/favicons";
import { PATHS } from "@/modules/paths";
import { getContentType } from "@/modules/utils";
import { Protocol } from "electron";
import path from "path";
import fsPromises from "fs/promises";

const FLOW_PROTOCOL_ALLOWED_DOMAINS: AllowedDomains = {
  about: true,
  error: true,
  "new-tab": true,
  games: true,
  omnibox: true,
  extensions: true,
  "pdf-viewer": true
};

const PDF_CACHE = new Map<string, Response>();

export function addPdfResponseToCache(key: string, response: Response) {
  PDF_CACHE.set(key, response);
}

function getPdfResponseFromCache(key: string): Response | undefined {
  return PDF_CACHE.get(key);
}

function removePdfResponseFromCache(key: string) {
  PDF_CACHE.delete(key);
}

export function registerFlowProtocol(protocol: Protocol) {
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

  const handleFaviconRequest = async (_request: Request, url: URL) => {
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

  const handleAssetRequest = async (_request: Request, url: URL) => {
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

  const handleExtensionIconRequest = async (_request: Request, url: URL) => {
    const extensionId = url.searchParams.get("id");
    const profileId = url.searchParams.get("profile");

    if (!extensionId || !profileId) {
      return new Response("Invalid request path", { status: 400 });
    }

    const loadedProfile = browser?.getLoadedProfile(profileId);
    if (!loadedProfile) {
      return new Response("No loaded profile found", { status: 404 });
    }

    const { extensionsManager } = loadedProfile;

    const extData = extensionsManager.getExtensionDataFromCache(extensionId);
    if (!extData) {
      return new Response("No extension data found", { status: 404 });
    }

    const extensionPath = await extensionsManager.getExtensionPath(extensionId, extData);
    if (!extensionPath) {
      return new Response("No extension path found", { status: 404 });
    }

    const icon = await getExtensionIcon(extensionPath);
    if (!icon) {
      return new Response("Extension icon not found", { status: 404 });
    }

    return new Response(icon.toPNG(), {
      headers: { "Content-Type": "image/png" }
    });
  };

  const handlePdfCacheRequest = async (_request: Request, url: URL) => {
    const pdfURL = url.searchParams.get("url");
    const key = url.searchParams.get("key");
    if (!pdfURL || !key) {
      return new Response("Invalid request path", { status: 400 });
    }

    const pdfResponse = getPdfResponseFromCache(key);
    if (!pdfResponse) {
      // redirect to actual url
      return Response.redirect(pdfURL);
    }

    removePdfResponseFromCache(key);
    return pdfResponse;
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

    // flow://extension-icon/:path
    if (url.host === "extension-icon") {
      return await handleExtensionIconRequest(request, url);
    }

    // flow://pdf-cache/:path
    if (url.host === "pdf-cache") {
      return await handlePdfCacheRequest(request, url);
    }

    // flow://:path
    return await handleDomainRequest(request, url);
  });
}

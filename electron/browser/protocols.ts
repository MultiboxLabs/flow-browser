import path from "path";
import { app, Protocol, session, Session } from "electron";
import { PATHS } from "../modules/paths";
import fsPromises from "fs/promises";
import { getContentType } from "../modules/utils";
import { getFavicon, normalizeURL } from "../modules/favicons";

function registerFlowUtilityProtocol(protocol: Protocol) {
  const FLOW_UTILITY_ALLOWED_DIRECTORIES = ["error", "settings"];

  const handlePageRequest = async (request: Request, url: URL) => {
    const queryString = url.search;

    // Remove the /page prefix to get the actual path
    const pathName = url.pathname;
    let pagePath = pathName;
    if (pagePath.startsWith("/")) {
      pagePath = pagePath.slice(1);
    }
    if (pagePath.endsWith("/")) {
      pagePath = pagePath.slice(0, -1);
    }

    // Redirect index.html to directory path
    if (pagePath.endsWith("/index.html")) {
      const redirectPath = `flow-utility://page/${pagePath.replace("/index.html", "/")}${queryString}`;
      return Response.redirect(redirectPath, 301);
    }

    // Build file path and check if it exists
    let filePath = path.join(PATHS.VITE_WEBUI, pagePath);

    try {
      // Check if path exists
      const stats = await fsPromises.stat(filePath);

      // Ensure the requested path is within the allowed directory structure
      const normalizedPath = path.normalize(filePath);
      const distDir = path.normalize(path.join(PATHS.VITE_WEBUI));
      if (!normalizedPath.startsWith(distDir)) {
        return new Response("Access denied", { status: 403 });
      }

      // If direct file is a directory, try serving index.html from that directory
      if (stats.isDirectory() && FLOW_UTILITY_ALLOWED_DIRECTORIES.includes(pagePath)) {
        const indexPath = path.join(filePath, "index.html");
        try {
          await fsPromises.access(indexPath);
          filePath = indexPath;
        } catch (error) {
          // Index.html doesn't exist in directory
          return new Response("Directory index not found", { status: 404 });
        }
      }

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
      console.error("Error serving file:", error);
      return new Response("File not found", { status: 404 });
    }
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

  protocol.handle("flow-utility", async (request) => {
    const urlString = request.url;

    const url = new URL(urlString);

    // flow-utility://page/:path
    if (url.host === "page") {
      return await handlePageRequest(request, url);
    }

    // flow-utility://favicon/:path
    if (url.host === "favicon") {
      return await handleFaviconRequest(request, url);
    }

    return new Response("Invalid request path", { status: 400 });
  });
}

export function registerProtocolsWithSession(session: Session) {
  const protocol = session.protocol;
  registerFlowUtilityProtocol(protocol);
}

app.whenReady().then(() => {
  const defaultSession = session.defaultSession;
  registerProtocolsWithSession(defaultSession);
});

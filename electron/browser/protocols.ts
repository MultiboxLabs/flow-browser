import path from "path";
import { Protocol, Session } from "electron";
import { PATHS } from "../modules/paths";
import fsPromises from "fs/promises";
import { getContentType } from "./utils";

function registerFlowUtilityProtocol(protocol: Protocol) {
  const FLOW_UTILITY_ALLOWED_DIRECTORIES = ["error"];

  protocol.handle("flow-utility", async (request) => {
    const urlString = request.url;

    // Extract the entire path correctly from custom protocol URL
    // For flow-utility://error/index.html, we need "error/index.html"
    const fullPath = urlString.substring(urlString.indexOf("://") + 3);
    const urlPath = fullPath.split("?")[0]; // Remove query parameters
    const queryString = fullPath.includes("?") ? fullPath.substring(fullPath.indexOf("?")) : "";

    // Check if this is a page request (starts with /page)
    if (!urlPath.startsWith("page/")) {
      return new Response("Invalid request path", { status: 400 });
    }

    // Remove the /page prefix to get the actual path
    const pagePath = urlPath.substring(5); // Remove "page/"

    // Redirect index.html to directory path
    if (pagePath.endsWith("/index.html")) {
      const redirectPath = `flow-utility://page/${pagePath.replace("/index.html", "/")}${queryString}`;
      return Response.redirect(redirectPath, 301);
    }

    // Build file path and check if it exists
    let filePath = path.join(PATHS.VITE_WEBUI, "dist", pagePath);

    try {
      // Check if path exists
      const stats = await fsPromises.stat(filePath);

      // Ensure the requested path is within the allowed directory structure
      const normalizedPath = path.normalize(filePath);
      const distDir = path.normalize(path.join(PATHS.VITE_WEBUI, "dist"));
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
  });
}

export function registerProtocolsWithSession(session: Session) {
  const protocol = session.protocol;
  registerFlowUtilityProtocol(protocol);
}

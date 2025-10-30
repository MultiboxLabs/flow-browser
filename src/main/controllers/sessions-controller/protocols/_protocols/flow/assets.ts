import { PATHS } from "@/modules/paths";
import { bufferToArrayBuffer, getContentType } from "@/modules/utils";
import path from "path";
import fsPromises from "fs/promises";
import { HonoApp } from ".";

export function registerAssetsRoutes(app: HonoApp) {
  app.get("/asset/*", async (c) => {
    // Extract the path after /asset
    let assetPath = c.req.path.replace(/^\/asset/, "");
    if (!assetPath || assetPath === "/") {
      return c.text("Asset path required", 400);
    }

    // Remove leading slash if present
    if (assetPath.startsWith("/")) {
      assetPath = assetPath.slice(1);
    }

    // Normalize the path to prevent directory traversal attacks
    const normalizedPath = path.normalize(assetPath).replace(/^(\.\.(\/|\\|$))+/, "");

    const filePath = path.join(PATHS.ASSETS, "public", normalizedPath);

    // Ensure the requested path is within the allowed directory
    const assetsDir = path.normalize(path.join(PATHS.ASSETS, "public"));
    if (!path.normalize(filePath).startsWith(assetsDir)) {
      return c.text("Access denied", 403);
    }

    try {
      // Read file contents
      const buffer = await fsPromises.readFile(filePath);

      // Determine content type based on file extension
      const contentType = getContentType(filePath);
      return c.body(bufferToArrayBuffer(buffer), 200, { "Content-Type": contentType });
    } catch (error) {
      console.error("Error serving asset:", error);
      return c.text("Asset not found", 404);
    }
  });
}

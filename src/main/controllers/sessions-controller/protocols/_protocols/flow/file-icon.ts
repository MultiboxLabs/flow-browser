import { app as electronApp } from "electron";
import { HonoApp } from ".";
import { bufferToArrayBuffer } from "@/modules/utils";
import { FLOW_DATA_DIR } from "@/modules/paths";
import path from "path";

type FileIconSize = "small" | "normal" | "large";

const FILE_ICON_SIZES = new Set<FileIconSize>(["small", "normal", "large"]);

/**
 * Validates that a given path is within one of the allowed directories.
 * This prevents path traversal attacks and file existence probing.
 */
function isPathAllowed(targetPath: string): boolean {
  const resolvedPath = path.resolve(targetPath);
  const allowedDirs = [electronApp.getPath("downloads"), FLOW_DATA_DIR];

  return allowedDirs.some((allowedDir) => {
    const resolvedAllowedDir = path.resolve(allowedDir);
    // Ensure the path starts with the allowed directory followed by a separator
    // to prevent matching partial directory names (e.g., /downloads-evil)
    return resolvedPath === resolvedAllowedDir || resolvedPath.startsWith(resolvedAllowedDir + path.sep);
  });
}

export function registerFileIconRoutes(app: HonoApp) {
  app.get("/file-icon", async (c) => {
    try {
      const explicitPath = c.req.query("path");
      const filename = c.req.query("name");
      const requestedSize = c.req.query("size");

      const targetPath = explicitPath ?? (filename ? path.join(electronApp.getPath("downloads"), filename) : null);

      if (!targetPath) {
        return c.text("No file path or filename provided", 400);
      }

      // Validate the path is within allowed directories to prevent
      // path traversal attacks and file existence probing
      if (!isPathAllowed(targetPath)) {
        return c.text("Access denied: path outside allowed directories", 403);
      }

      const size: FileIconSize =
        requestedSize && FILE_ICON_SIZES.has(requestedSize as FileIconSize)
          ? (requestedSize as FileIconSize)
          : "normal";
      const icon = await electronApp.getFileIcon(targetPath, { size });

      if (icon.isEmpty()) {
        return c.text("No icon found", 404);
      }

      return c.body(bufferToArrayBuffer(icon.toPNG()), 200, { "Content-Type": "image/png" });
    } catch (error) {
      console.error("Error retrieving file icon:", error);
      return c.text("Internal server error", 500);
    }
  });
}

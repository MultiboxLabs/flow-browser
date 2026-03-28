import { app as electronApp } from "electron";
import { HonoApp } from ".";
import { bufferToArrayBuffer } from "@/modules/utils";
import path from "path";

type FileIconSize = "small" | "normal" | "large";

const FILE_ICON_SIZES = new Set<FileIconSize>(["small", "normal", "large"]);

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

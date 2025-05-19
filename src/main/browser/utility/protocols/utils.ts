import { fetchFromDevServer, isDevelopmentServerRunning } from "@/browser/utility/hot-reload";
import { setupHotReloadFileDescriptors } from "@/browser/utility/hot-reload";
import { FLAGS } from "@/modules/flags";
import { PATHS } from "@/modules/paths";
import { getContentType } from "@/modules/utils";
import { app } from "electron";
import path from "path";
import fsPromises from "fs/promises";

export interface AllowedDomains {
  [key: string]: true | string;
}

export async function serveStaticFile(
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
    const ping = isDevelopmentServerRunning();
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

import { PATHS } from "@/modules/paths";
import type { Context } from "hono";
import path from "path";
import fs from "fs/promises";
import { bufferToArrayBuffer, getContentType } from "@/modules/utils";
import { FLAGS } from "@/modules/flags";
import { app } from "electron";
import {
  fetchFromDevServer,
  isDevelopmentServerRunning,
  setupHotReloadFileDescriptors
} from "@/controllers/sessions-controller/protocols/static-domains/hot-reload";

interface ServeOptions {
  overrideRouteName?: string;
  extraBaseDir?: string;
  bypassEntrypointCheck?: boolean;
  bypassTrailingSlashCheck?: boolean;
}

function transformRouteToEntrypoint(route: string) {
  return `route-${route}.html`;
}

function isRouteEntrypoint(pathComponent: string) {
  if (!pathComponent.startsWith("route-")) {
    return false;
  }
  if (!pathComponent.endsWith(".html")) {
    return false;
  }
  return true;
}

export async function serveStaticDomainFile(c: Context, pathStr: string, options: ServeOptions = {}) {
  const notFound = c.text("Not found", 404);

  // Prevent path traversal attacks
  if (/(?:^|[/\\])\.\.(?:$|[/\\])/.test(pathStr)) {
    return notFound;
  }

  // Remove empty path components and trailing slashes
  const pathComponents = pathStr
    .split("/")
    .map((p) => p.trim())
    .filter((p) => p !== "");

  // Handle trailing slashes
  // Hono automatically removes the trailing slash, but that doesn't fix browser issues with loading other assets.
  // So we need to handle it manually and redirect to the correct path.
  const rawUrl = c.req.raw.url;
  if (!options.bypassTrailingSlashCheck && pathComponents.length > 0 && rawUrl.endsWith("/")) {
    return c.redirect(rawUrl.slice(0, -1));
  }

  // Handle special cases
  if (
    pathComponents.length === 0 ||
    (pathComponents.length === 1 && pathComponents[0].toLowerCase() === "index.html")
  ) {
    // this is the root path, "/" or "/index.html"
    if (options.overrideRouteName) {
      return serveStaticDomainFile(c, transformRouteToEntrypoint(options.overrideRouteName), {
        ...options,
        bypassEntrypointCheck: true,
        bypassTrailingSlashCheck: true
      });
    }
  } else if (pathComponents.length === 1 && isRouteEntrypoint(pathComponents[0]) && !options.bypassEntrypointCheck) {
    // this is a route entrypoint, which should never be served directly
    // If this is removed, it will allow serving routes from a different domain that expected, which might cause issues.
    return notFound;
  }

  // Get base path
  let basePath = PATHS.VITE_WEBUI;
  if (options.extraBaseDir) {
    basePath = path.join(basePath, options.extraBaseDir);
  }

  // Attempt to serve the file from development server if we're not packaged
  if (FLAGS.DEBUG_HOT_RELOAD_FRONTEND && !app.isPackaged) {
    setupHotReloadFileDescriptors();

    // Make sure the development server is running
    const ping = isDevelopmentServerRunning();
    if (ping) {
      const devServerPathComponents = [...pathComponents];
      // If the path is empty, serve the index.html file
      if (devServerPathComponents.length === 0) {
        devServerPathComponents.push("index.html");
      }
      // If there is an extra base directory, add it to the path
      if (options.extraBaseDir) {
        devServerPathComponents.unshift(options.extraBaseDir);
      }

      return await fetchFromDevServer(devServerPathComponents.join("/"), c.req.raw);
    }
  }

  // Handle normal cases
  const fullPath = path.join(basePath, ...pathComponents);

  try {
    const stats = await fs.stat(fullPath);
    if (stats.isDirectory()) {
      // Serve index.html if it is a directory
      return serveStaticDomainFile(c, [...pathComponents, "index.html"].join("/"), {
        ...options,
        bypassEntrypointCheck: true,
        bypassTrailingSlashCheck: true
      });
    }

    // Read file contents
    const buffer = await fs.readFile(fullPath);

    // Determine content type based on file extension
    const contentType = getContentType(fullPath);

    // Serve file
    return c.body(bufferToArrayBuffer(buffer), 200, { "Content-Type": contentType });
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      return notFound;
    }
    console.error("Error serving static domain file:", pathStr, error);
    return c.text("Internal server error", 500);
  }
}

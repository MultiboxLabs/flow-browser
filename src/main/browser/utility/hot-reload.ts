import { app, net } from "electron";
import { FLAGS } from "@/modules/flags";

/**
 * Sets a higher file descriptor limit for development hot reloading
 * to prevent "too many open files" errors
 */
export function setupHotReloadFileDescriptors() {
  if (FLAGS.DEBUG_HOT_RELOAD_FRONTEND && !app.isPackaged) {
    if ("setFdLimit" in process) {
      process.setFdLimit(8192);
    }
  }
}

/**
 * Checks if the development server is running at the specified port
 * @returns True if the server is running, false otherwise
 */
export function isDevelopmentServerRunning(): boolean {
  if (!app.isPackaged && process.env["ELECTRON_RENDERER_URL"]) {
    return true;
  }

  return false;
}

// This is needed or electron will give out INSUFFICIENT_RESOURCES errors
let amountOfRequests = 0;
const MAX_REQUESTS = 2048;

function getRandomTimeout() {
  const MIN_TIMEOUT = 300;
  const MAX_TIMEOUT = 500;
  return Math.floor(Math.random() * (MAX_TIMEOUT - MIN_TIMEOUT + 1)) + MIN_TIMEOUT;
}

/**
 * Fetches a file from the development server
 * @param path The file path relative to the development server root
 * @param request The original request object to forward headers and other properties
 * @returns The response from the development server
 */
export async function fetchFromDevServer(path: string, request?: Request): Promise<Response> {
  const ELECTRON_RENDERER_URL = process.env["ELECTRON_RENDERER_URL"];
  if (!ELECTRON_RENDERER_URL) {
    throw new Error("ELECTRON_RENDERER_URL is not set");
  }

  const ELECTRON_RENDERER_BASE_URL = new URL(ELECTRON_RENDERER_URL);
  ELECTRON_RENDERER_BASE_URL.pathname = "";
  const ELECTRON_RENDERER_BASE_URL_STRING = ELECTRON_RENDERER_BASE_URL.toString();

  const url = new URL(`${ELECTRON_RENDERER_BASE_URL_STRING}${path}`);

  if (request?.url) {
    const reqURL = URL.parse(request?.url);
    if (reqURL) {
      url.search = reqURL.search;
      url.hash = reqURL.hash;
    }
  }

  while (amountOfRequests >= MAX_REQUESTS) {
    await new Promise((resolve) => setTimeout(resolve, getRandomTimeout()));
  }

  amountOfRequests++;

  const response = await net.fetch(url.toString(), {
    ...request,
    mode: "no-cors"
  });

  setTimeout(() => {
    amountOfRequests--;
  }, getRandomTimeout());

  return response;
}

import { app, Protocol, net } from "electron";
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

let isDevServerRunning = false;

/**
 * Checks if the development server is running at the specified port
 * @param port The port to check, defaults to 5173 (Vite's default port)
 * @returns Promise resolving to true if the server is running, false otherwise
 */
export async function isDevelopmentServerRunning(port: number = 5173): Promise<boolean> {
  if (isDevServerRunning) return true;

  return await fetch(`http://localhost:${port}`)
    .then(() => {
      isDevServerRunning = true;
      return true;
    })
    .catch(() => {
      isDevServerRunning = false;
      return false;
    });
}

// This is needed or electron will give out INSUFFICIENT_RESOURCES errors
let amountOfRequests = 0;
const MAX_REQUESTS = 2048;

function getRandomTimeout() {
  const MIN_TIMEOUT = 100;
  const MAX_TIMEOUT = 500;
  return Math.floor(Math.random() * (MAX_TIMEOUT - MIN_TIMEOUT + 1)) + MIN_TIMEOUT;
}

/**
 * Fetches a file from the development server
 * @param path The file path relative to the development server root
 * @param request The original request object to forward headers and other properties
 * @param port The port of the development server, defaults to 5173 (Vite's default port)
 * @returns The response from the development server
 */
export async function fetchFromDevServer(path: string, request?: Request, port: number = 5173): Promise<Response> {
  const url = new URL(`http://localhost:${port}/${path}`);

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

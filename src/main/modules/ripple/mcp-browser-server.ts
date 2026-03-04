import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";
import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { z } from "zod";

/**
 * MCP Browser Tools Server
 *
 * Runs an HTTP-based MCP server inside the Electron main process,
 * providing tools for AI agents to interact with web pages.
 * The server has direct access to Electron's webContents API.
 *
 * Uses STATELESS mode: a fresh McpServer + Transport is created per request.
 * This avoids transport reuse issues and is the pattern recommended by the MCP SDK
 * for servers that don't need server-initiated notifications.
 */

let httpServer: Server | null = null;
let serverPort: number | null = null;

/** Resolve a tab ID to its webContents, falling back to the focused tab. */
function getWebContents(tabId?: number) {
  if (tabId !== undefined) {
    const tab = tabsController.getTabById(tabId);
    if (tab?.webContents && !tab.webContents.isDestroyed()) {
      return tab.webContents;
    }
    return null;
  }

  // Fall back to the focused tab in the first browser window
  const windows = browserWindowsController.getWindows();
  for (const win of windows) {
    const spaceId = tabsController.windowActiveSpaceMap.get(win.id);
    if (!spaceId) continue;
    const focusedTab = tabsController.getFocusedTab(win.id, spaceId);
    if (focusedTab?.webContents && !focusedTab.webContents.isDestroyed()) {
      return focusedTab.webContents;
    }
  }
  return null;
}

function registerBrowserTools(server: McpServer) {
  // get_page_content — Extract text or HTML from the current page
  server.tool(
    "get_page_content",
    "Get the text or HTML content of the current web page. Use format 'text' for readable text content, 'html' for the full HTML source.",
    {
      format: z
        .enum(["text", "html"])
        .default("text")
        .describe("Output format: 'text' for readable content, 'html' for raw HTML"),
      tabId: z.number().optional().describe("Optional tab ID. Defaults to the focused tab.")
    },
    async ({ format, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const script = format === "html" ? "document.documentElement.outerHTML" : "document.body.innerText";
        const result = await wc.executeJavaScript(script);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error extracting content: ${e}` }] };
      }
    }
  );

  // get_page_url — Get the current page URL
  server.tool(
    "get_page_url",
    "Get the URL of the current web page.",
    { tabId: z.number().optional().describe("Optional tab ID. Defaults to the focused tab.") },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };
      return { content: [{ type: "text" as const, text: wc.getURL() }] };
    }
  );

  // get_page_title — Get the current page title
  server.tool(
    "get_page_title",
    "Get the title of the current web page.",
    { tabId: z.number().optional().describe("Optional tab ID. Defaults to the focused tab.") },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };
      return { content: [{ type: "text" as const, text: wc.getTitle() }] };
    }
  );

  // navigate — Navigate to a URL
  server.tool(
    "navigate",
    "Navigate the current tab to a new URL.",
    { url: z.string().describe("The URL to navigate to."), tabId: z.number().optional().describe("Optional tab ID.") },
    async ({ url, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        await wc.loadURL(url);
        return { content: [{ type: "text" as const, text: `Navigated to ${url}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error navigating: ${e}` }] };
      }
    }
  );

  // go_back — Navigate back
  server.tool(
    "go_back",
    "Navigate back in the browser history.",
    { tabId: z.number().optional().describe("Optional tab ID.") },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      if (wc.navigationHistory.canGoBack()) {
        wc.navigationHistory.goBack();
        return { content: [{ type: "text" as const, text: "Navigated back." }] };
      }
      return { content: [{ type: "text" as const, text: "Cannot go back — no history." }] };
    }
  );

  // go_forward — Navigate forward
  server.tool(
    "go_forward",
    "Navigate forward in the browser history.",
    { tabId: z.number().optional().describe("Optional tab ID.") },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      if (wc.navigationHistory.canGoForward()) {
        wc.navigationHistory.goForward();
        return { content: [{ type: "text" as const, text: "Navigated forward." }] };
      }
      return { content: [{ type: "text" as const, text: "Cannot go forward — no history." }] };
    }
  );

  // click_element — Click an element by CSS selector
  server.tool(
    "click_element",
    "Click an element on the page identified by a CSS selector.",
    { selector: z.string().describe("CSS selector for the element to click."), tabId: z.number().optional() },
    async ({ selector, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const result = await wc.executeJavaScript(`
          (() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) return 'Element not found: ${selector}';
            el.click();
            return 'Clicked: ' + (el.textContent || '').slice(0, 100).trim();
          })()
        `);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error clicking element: ${e}` }] };
      }
    }
  );

  // type_text — Type text into an input element
  server.tool(
    "type_text",
    "Type text into an input element identified by a CSS selector.",
    {
      selector: z.string().describe("CSS selector for the input element."),
      text: z.string().describe("Text to type into the element."),
      tabId: z.number().optional()
    },
    async ({ selector, text, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        await wc.executeJavaScript(`
          (() => {
            const el = document.querySelector(${JSON.stringify(selector)});
            if (!el) throw new Error('Element not found: ${selector}');
            el.focus();
            el.value = ${JSON.stringify(text)};
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
          })()
        `);
        return { content: [{ type: "text" as const, text: `Typed text into ${selector}` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error typing: ${e}` }] };
      }
    }
  );

  // scroll_page — Scroll the page
  server.tool(
    "scroll_page",
    "Scroll the page by a given amount in pixels.",
    {
      x: z.number().default(0).describe("Horizontal scroll amount in pixels."),
      y: z.number().default(0).describe("Vertical scroll amount in pixels (positive = down)."),
      tabId: z.number().optional()
    },
    async ({ x, y, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        await wc.executeJavaScript(`window.scrollBy(${x}, ${y})`);
        return { content: [{ type: "text" as const, text: `Scrolled by (${x}, ${y})` }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error scrolling: ${e}` }] };
      }
    }
  );

  // evaluate_js — Run arbitrary JavaScript
  server.tool(
    "evaluate_js",
    "Execute arbitrary JavaScript code on the page and return the result. Use this for complex interactions not covered by other tools.",
    { code: z.string().describe("JavaScript code to execute."), tabId: z.number().optional() },
    async ({ code, tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const result = await wc.executeJavaScript(code);
        const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
        return { content: [{ type: "text" as const, text: text ?? "undefined" }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error executing JS: ${e}` }] };
      }
    }
  );

  // screenshot — Take a screenshot of the page
  server.tool(
    "screenshot",
    "Take a screenshot of the current page. Returns a base64-encoded PNG image.",
    { tabId: z.number().optional() },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const image = await wc.capturePage();
        const base64 = image.toPNG().toString("base64");
        return {
          content: [{ type: "image" as const, data: base64, mimeType: "image/png" }]
        };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error taking screenshot: ${e}` }] };
      }
    }
  );

  // get_page_links — List all links on the page
  server.tool(
    "get_page_links",
    "Get all links on the current page with their text and href attributes.",
    { tabId: z.number().optional() },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const result = await wc.executeJavaScript(`
          JSON.stringify(
            Array.from(document.querySelectorAll('a[href]')).slice(0, 200).map(a => ({
              text: (a.textContent || '').trim().slice(0, 100),
              href: a.href
            }))
          )
        `);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error getting links: ${e}` }] };
      }
    }
  );

  // get_page_inputs — List all form inputs
  server.tool(
    "get_page_inputs",
    "Get all form input elements on the current page.",
    { tabId: z.number().optional() },
    async ({ tabId }) => {
      const wc = getWebContents(tabId);
      if (!wc) return { content: [{ type: "text" as const, text: "Error: No active tab found." }] };

      try {
        const result = await wc.executeJavaScript(`
          JSON.stringify(
            Array.from(document.querySelectorAll('input, textarea, select')).slice(0, 100).map(el => ({
              tag: el.tagName.toLowerCase(),
              type: el.type || undefined,
              name: el.name || undefined,
              id: el.id || undefined,
              placeholder: el.placeholder || undefined,
              value: (el.value || '').slice(0, 50)
            }))
          )
        `);
        return { content: [{ type: "text" as const, text: result }] };
      } catch (e) {
        return { content: [{ type: "text" as const, text: `Error getting inputs: ${e}` }] };
      }
    }
  );
}

/** Create a fresh McpServer with browser tools registered. */
function createBrowserMcpServer(): McpServer {
  const server = new McpServer({
    name: "flow-browser",
    version: "1.0.0"
  });
  registerBrowserTools(server);
  return server;
}

/** Collect the full request body as a string. */
function collectBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString()));
    req.on("error", reject);
  });
}

/** Send a JSON-RPC error response. */
function sendJsonRpcError(res: ServerResponse, statusCode: number, code: number, message: string) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: { code, message },
      id: null
    })
  );
}

/**
 * Start the MCP Browser Tools server on a dynamic port.
 * Returns the port number.
 *
 * Uses stateless mode: each POST request creates a fresh McpServer +
 * StreamableHTTPServerTransport, processes the request, then cleans up.
 * GET and DELETE return 405 (not applicable in stateless mode).
 */
export async function startMcpBrowserServer(): Promise<number> {
  if (serverPort !== null) return serverPort;

  httpServer = createServer(async (req, res) => {
    // Only handle /mcp path (strip query string and trailing slash)
    const urlPath = (req.url || "").split("?")[0].replace(/\/+$/, "");
    if (urlPath !== "/mcp") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    if (req.method === "POST") {
      // Stateless mode: create a fresh server + transport per request
      const mcpServer = createBrowserMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined // stateless mode
      });

      try {
        // Connect server to transport (wires up onmessage/send callbacks)
        await mcpServer.connect(transport);

        // Collect and parse the request body
        const bodyStr = await collectBody(req);
        let parsedBody: unknown;
        try {
          parsedBody = JSON.parse(bodyStr);
        } catch {
          sendJsonRpcError(res, 400, -32700, "Parse error");
          await transport.close();
          await mcpServer.close();
          return;
        }

        // Handle the request — transport writes directly to res
        await transport.handleRequest(req, res, parsedBody);

        // Clean up when the response is done
        res.on("close", () => {
          transport.close();
          mcpServer.close();
        });
      } catch (e) {
        console.error("[Ripple MCP] Error handling POST:", e);
        if (!res.headersSent) {
          sendJsonRpcError(res, 500, -32603, "Internal server error");
        }
        await transport.close();
        await mcpServer.close();
      }
    } else if (req.method === "GET" || req.method === "DELETE") {
      // Stateless mode: GET (SSE stream) and DELETE (session close) are not applicable
      sendJsonRpcError(res, 405, -32000, "Method not allowed.");
    } else {
      // Other methods (PUT, PATCH, etc.)
      res.writeHead(405, { Allow: "GET, POST, DELETE" });
      res.end("Method not allowed");
    }
  });

  return new Promise<number>((resolve, reject) => {
    httpServer!.listen(0, "127.0.0.1", () => {
      const addr = httpServer!.address();
      if (addr && typeof addr === "object") {
        serverPort = addr.port;
        console.log(`[Ripple] MCP Browser Tools server running on port ${serverPort}`);
        resolve(serverPort);
      } else {
        reject(new Error("Failed to get MCP server address"));
      }
    });
    httpServer!.on("error", reject);
  });
}

/** Stop the MCP Browser Tools server. */
export async function stopMcpBrowserServer(): Promise<void> {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
  serverPort = null;
}

/** Get the current MCP server port, or null if not running. */
export function getMcpBrowserServerPort(): number | null {
  return serverPort;
}

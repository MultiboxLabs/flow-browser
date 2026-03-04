import { createOpencode } from "@opencode-ai/sdk";
import { startMcpBrowserServer, stopMcpBrowserServer } from "./mcp-browser-server";
import type { RippleStatus } from "~/flow/interfaces/ripple/interface";

/**
 * RippleService manages the OpenCode server lifecycle.
 *
 * Session management, messages, and model selection are handled
 * directly by the SDK client in the renderer process.
 *
 * Configures two custom agents:
 *   - "browse": Only MCP browser tools (no filesystem/bash access)
 *   - "work": Full access to all tools
 */
class RippleService {
  private opencode: Awaited<ReturnType<typeof createOpencode>> | null = null;
  private status: RippleStatus = "stopped";
  private statusError: string | undefined;
  private serverUrl: string | null = null;

  getStatus(): RippleStatus {
    return this.status;
  }

  getStatusError(): string | undefined {
    return this.statusError;
  }

  getServerUrl(): string | null {
    return this.serverUrl;
  }

  /** Initialize the OpenCode server and MCP browser tools. Returns the server URL. */
  async initialize(): Promise<{ url: string } | null> {
    if (this.status === "running" && this.serverUrl) {
      return { url: this.serverUrl };
    }
    if (this.status === "starting") return null;

    this.status = "starting";
    this.statusError = undefined;

    try {
      // Start MCP browser tools server first
      const mcpPort = await startMcpBrowserServer();

      // Start OpenCode server with port 0 (random) to avoid conflicts
      this.opencode = await createOpencode({
        port: 0,
        config: {
          mcp: {
            "flow-browser": {
              type: "remote",
              url: `http://127.0.0.1:${mcpPort}/mcp`
            }
          },
          agent: {
            // Browse agent: only MCP browser tools, no filesystem/bash access
            browse: {
              description: "Browser interaction agent with access to web page tools only",
              mode: "primary",
              permission: {
                edit: "deny",
                bash: "deny",
                webfetch: "deny",
                external_directory: "deny"
              }
            },
            // Work agent: full access to all tools
            work: {
              description: "Full-access work agent for desktop and filesystem tasks",
              mode: "primary",
              permission: {
                edit: "allow",
                bash: "allow",
                webfetch: "allow",
                external_directory: "allow"
              }
            }
          }
        }
      });

      this.serverUrl = this.opencode.server.url;
      this.status = "running";
      console.log(`[Ripple] OpenCode server started at ${this.serverUrl}`);
      return { url: this.serverUrl };
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("[Ripple] Failed to initialize:", errorMsg);
      this.status = "error";
      this.statusError = errorMsg;
      return null;
    }
  }

  /** Shutdown everything. */
  async shutdown(): Promise<void> {
    if (this.opencode) {
      try {
        this.opencode.server.close();
      } catch {
        // ignore
      }
      this.opencode = null;
    }
    this.serverUrl = null;
    await stopMcpBrowserServer();
    this.status = "stopped";
  }
}

/** Singleton instance. */
export const rippleService = new RippleService();

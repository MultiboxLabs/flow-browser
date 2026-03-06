import ErrorTracking from "./posthog-error-capture-sdk";
import { sanitizeProperties } from "./sanitize-pii";
import { getSessionId } from "./session";
import { app, crashReporter } from "electron";
import { PostHog } from "posthog-node";
import { _getPosthogIdentifier } from "./identify";

const IS_ENABLED = app.isPackaged;

class PosthogController {
  private client: PostHog | null = null;

  public isIdentifierReady: boolean = false;

  constructor() {
    if (!IS_ENABLED) return;

    this.client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
      host: "https://eu.i.posthog.com",
      disableGeoip: false,
      enableExceptionAutocapture: true
    });

    const identifierPromise = this.getPosthogIdentifier();
    identifierPromise.then((identifier) => {
      this.isIdentifierReady = true;

      this.client!.identify({
        distinctId: identifier,
        properties: {
          ...this.getAppInfoForPosthog()
        }
      });

      new ErrorTracking(this.client!, {
        fallbackDistinctId: identifier,
        enableExceptionAutocapture: true
      });
    });

    this.captureEvent("app-started");

    this.setupCrashReporter();

    app.on("before-quit", () => {
      this.client!.shutdown();
    });
  }

  public async getPosthogIdentifier(): Promise<string> {
    return await _getPosthogIdentifier();
  }

  /**
   * Capture an event. Properties are automatically sanitized to remove PII
   * and enriched with session context.
   */
  public async captureEvent(event: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.client) return;
    const identifier = await this.getPosthogIdentifier();
    this.client.capture({
      distinctId: identifier,
      event,
      properties: sanitizeProperties({
        ...properties,
        $session_id: getSessionId()
      })
    });
  }

  /**
   * Capture an exception. Properties are automatically sanitized to remove PII
   * and enriched with session context.
   */
  public async captureException(error: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.client) return;
    const identifier = await this.getPosthogIdentifier();
    this.client.captureException(
      error,
      identifier,
      sanitizeProperties({
        ...properties,
        $session_id: getSessionId()
      })
    );
  }

  private setupCrashReporter(): void {
    crashReporter.start({
      submitURL: "",
      uploadToServer: false,
      extra: {
        sessionId: getSessionId()
      }
    });

    app.on("child-process-gone", (_event, details) => {
      this.captureEvent("crash-child-process-gone", {
        type: details.type,
        reason: details.reason,
        exitCode: details.exitCode,
        serviceName: details.serviceName,
        name: details.name
      });
    });

    app.on("render-process-gone", (_event, webContents, details) => {
      this.captureEvent("crash-render-process-gone", {
        reason: details.reason,
        exitCode: details.exitCode,
        webContentsId: webContents.id
      });
    });
  }

  private getAppInfoForPosthog() {
    return {
      version: app.getVersion(),
      platform: process.platform,
      environment: process.env.NODE_ENV
    };
  }
}

export const posthogController = new PosthogController();

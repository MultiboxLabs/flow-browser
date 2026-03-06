import ErrorTracking from "./posthog-error-capture-sdk";
import { sanitizeProperties } from "./sanitize-pii";
import { getSessionId } from "./session";
import { app } from "electron";
import { PostHog } from "posthog-node";
import { _getPosthogIdentifier } from "./identify";

class PosthogController {
  private client: PostHog;

  public isIdentifierReady: boolean = false;

  constructor() {
    const enableExceptionAutocapture = app.isPackaged;

    this.client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
      host: "https://eu.i.posthog.com",
      disableGeoip: false,
      enableExceptionAutocapture
    });

    const identifierPromise = this.getPosthogIdentifier();
    identifierPromise.then((identifier) => {
      this.isIdentifierReady = true;

      this.client.identify({
        distinctId: identifier,
        properties: {
          ...this.getAppInfoForPosthog()
        }
      });

      new ErrorTracking(this.client, {
        fallbackDistinctId: identifier,
        enableExceptionAutocapture: true
      });
    });

    this.captureEvent("app-started");

    app.on("before-quit", () => {
      this.client.shutdown();
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

  private getAppInfoForPosthog() {
    return {
      version: app.getVersion(),
      platform: process.platform,
      environment: process.env.NODE_ENV
    };
  }
}

export const posthogController = new PosthogController();

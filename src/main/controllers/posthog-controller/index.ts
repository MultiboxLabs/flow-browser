// This controller handles PostHog events and exceptions.

import ErrorTracking from "./posthog-error-capture-sdk";
import { app } from "electron";
import { PostHog } from "posthog-node";
import { _getPosthogIdentifier } from "./identify";

class PosthogController {
  /**
   * The PostHog client.
   */
  private client: PostHog;

  /**
   * Whether the PostHog identifier is ready.
   */
  public isIdentifierReady: boolean = false;

  constructor() {
    const enableExceptionAutocapture = app.isPackaged;

    this.client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
      host: "https://eu.i.posthog.com",
      disableGeoip: false,
      enableExceptionAutocapture
    });

    // Warm identifier cache
    const identifierPromise = this.getPosthogIdentifier();
    identifierPromise.then((identifier) => {
      this.isIdentifierReady = true;

      // Identify user
      this.client.identify({
        distinctId: identifier,
        properties: {
          ...this.getAppInfoForPosthog()
        }
      });

      // Auto capture exceptions
      new ErrorTracking(this.client, {
        fallbackDistinctId: identifier,
        enableExceptionAutocapture: true
      });
    });

    // Capture app started
    this.captureEvent("app-started");

    // Shutdown client on app quit
    app.on("before-quit", () => {
      this.client.shutdown();
    });
  }

  /**
   * Get the PostHog identifier.
   * @returns The PostHog identifier.
   */
  public async getPosthogIdentifier(): Promise<string> {
    return await _getPosthogIdentifier();
  }

  /**
   * Capture an event.
   * @param event - The event to capture.
   * @param properties - The properties to capture.
   */
  public async captureEvent(event: string, properties?: Record<string, unknown>): Promise<void> {
    const identifier = await this.getPosthogIdentifier();
    this.client.capture({
      distinctId: identifier,
      event,
      properties: {
        ...properties
      }
    });
  }

  /**
   * Capture an exception.
   * @param error - The error to capture.
   * @param properties - The properties to capture.
   */
  public async captureException(error: string, properties?: Record<string, unknown>): Promise<void> {
    const identifier = await this.getPosthogIdentifier();
    this.client.captureException(error, identifier, {
      ...properties
    });
  }

  /**
   * Get the app info for PostHog.
   * @returns The app info for PostHog.
   */
  private getAppInfoForPosthog() {
    return {
      version: app.getVersion(),
      platform: process.platform,
      environment: process.env.NODE_ENV
    };
  }
}

export const posthogController = new PosthogController();

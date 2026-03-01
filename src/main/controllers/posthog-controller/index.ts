// This controller handles PostHog events and exceptions.

import ErrorTracking from "./posthog-error-capture-sdk";
import { app } from "electron";
import { PostHog } from "posthog-node";
import { _getPosthogIdentifier } from "./identify";
import { release } from "os";
import { randomUUID } from "crypto";

const SENSITIVE_PROPERTY_PATTERNS = [
  /url/i,
  /uri/i,
  /history/i,
  /tab/i,
  /title/i,
  /search/i,
  /query/i,
  /cookie/i,
  /session/i,
  /storage/i,
  /password/i,
  /token/i,
  /auth/i,
  /header/i,
  /content/i,
  /body/i,
  /payload/i,
  /html/i
];

const URL_REDACTION_PATTERN = /https?:\/\/\S+/gi;

function isSensitivePropertyKey(key: string): boolean {
  return SENSITIVE_PROPERTY_PATTERNS.some((pattern) => pattern.test(key));
}

function sanitizePropertyValue(value: unknown): unknown {
  if (typeof value === "string") {
    return value.replace(URL_REDACTION_PATTERN, "[REDACTED_URL]").slice(0, 400);
  }

  if (typeof value === "number" || typeof value === "boolean" || value === null) {
    return value;
  }

  if (Array.isArray(value)) {
    return `[REDACTED_ARRAY:${value.length}]`;
  }

  if (typeof value === "object") {
    return "[REDACTED_OBJECT]";
  }

  return "[REDACTED_VALUE]";
}

function sanitizeProperties(properties?: Record<string, unknown>): Record<string, unknown> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (isSensitivePropertyKey(key)) {
      continue;
    }

    sanitized[key] = sanitizePropertyValue(value);
  }

  return sanitized;
}

class PosthogController {
  /**
   * The PostHog client.
   */
  private client: PostHog;

  /**
   * Stable PostHog session id for this app process lifetime.
   */
  private readonly sessionId: string = randomUUID();

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
          ...this.getAppInfoForPosthog(),
          active_session_id: this.sessionId
        }
      });

      // Auto capture exceptions
      new ErrorTracking(this.client, {
        fallbackDistinctId: identifier,
        enableExceptionAutocapture: true,
        additionalExceptionProperties: {
          ...this.getAppInfoForPosthog(),
          $session_id: this.sessionId,
          privacy_mode: "minimal"
        }
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
    const appInfo = this.getAppInfoForPosthog();

    this.client.capture({
      distinctId: identifier,
      event,
      properties: {
        ...appInfo,
        ...sanitizeProperties(properties),
        $session_id: this.sessionId,
        privacy_mode: "minimal"
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
    const appInfo = this.getAppInfoForPosthog();

    this.client.captureException(error, identifier, {
      ...appInfo,
      ...sanitizeProperties(properties),
      $session_id: this.sessionId,
      privacy_mode: "minimal"
    });
  }

  /**
   * Get the app info for PostHog.
   * @returns The app info for PostHog.
   */
  private getAppInfoForPosthog() {
    return {
      app_version: app.getVersion(),
      app_name: app.getName(),
      app_packaged: app.isPackaged,
      platform: process.platform,
      platform_version: release(),
      arch: process.arch,
      node_version: process.versions.node,
      electron_version: process.versions.electron,
      chrome_version: process.versions.chrome,
      v8_version: process.versions.v8,
      locale: app.getLocale(),
      environment: process.env.NODE_ENV
    };
  }
}

export const posthogController = new PosthogController();

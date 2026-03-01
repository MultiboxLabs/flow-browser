/* eslint-disable @typescript-eslint/no-explicit-any */

import { EventHint, StackFrameModifierFn, StackParser } from "./types";
import { addUncaughtExceptionListener, addUnhandledRejectionListener } from "./autocapture";
import { propertiesFromUnknownInput } from "./error-conversion";
import { EventMessage, PostHog, PostHogOptions } from "posthog-node";
import { randomUUID } from "crypto";
import { createStackParser } from "./stack-parser";

const SHUTDOWN_TIMEOUT = 2000;

export default class ErrorTracking {
  private client: PostHog;
  private _exceptionAutocaptureEnabled: boolean;

  private fallbackDistinctId?: string;
  private readonly additionalExceptionProperties?: Record<string, unknown>;

  static stackParser: StackParser;
  static frameModifiers: StackFrameModifierFn[];

  static async captureException(
    client: PostHog,
    error: unknown,
    hint: EventHint,
    distinctId?: string,
    additionalProperties?: Record<string | number, any>
  ): Promise<void> {
    const properties: EventMessage["properties"] = { ...additionalProperties };

    // Ensure exception events are associated with a person profile whenever a distinct_id exists.
    // If we do not have one, fall back to personless processing.
    properties.$process_person_profile = Boolean(distinctId);

    const exceptionProperties = await propertiesFromUnknownInput(this.stackParser, this.frameModifiers, error, hint);

    client.capture({
      event: "$exception",
      distinctId: distinctId || randomUUID(),
      properties: {
        ...exceptionProperties,
        ...properties
      }
    });
  }

  constructor(
    client: PostHog,
    options: PostHogOptions & {
      fallbackDistinctId?: string;
      additionalExceptionProperties?: Record<string, unknown>;
    }
  ) {
    this.client = client;
    this._exceptionAutocaptureEnabled = options.enableExceptionAutocapture || false;
    this.fallbackDistinctId = options.fallbackDistinctId;
    this.additionalExceptionProperties = options.additionalExceptionProperties;

    this.startAutocaptureIfEnabled();
  }

  private startAutocaptureIfEnabled(): void {
    if (this.isEnabled()) {
      addUncaughtExceptionListener(this.onException.bind(this), this.onFatalError.bind(this));
      addUnhandledRejectionListener(this.onException.bind(this));
    }
  }

  private onException(exception: unknown, hint: EventHint): void {
    ErrorTracking.captureException(
      this.client,
      exception,
      hint,
      this.fallbackDistinctId,
      this.additionalExceptionProperties
    );
  }

  private async onFatalError(): Promise<void> {
    await this.client.shutdown(SHUTDOWN_TIMEOUT);
  }

  isEnabled(): boolean {
    return !this.client.isDisabled && this._exceptionAutocaptureEnabled;
  }
}

ErrorTracking.stackParser = createStackParser();
ErrorTracking.frameModifiers = [];

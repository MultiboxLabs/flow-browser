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

    // Given stateless nature of Node SDK we capture exceptions using personless processing when no
    // user can be determined because a distinct_id is not provided e.g. exception autocapture
    if (!distinctId) {
      properties.$process_person_profile = false;
    }

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

  constructor(client: PostHog, options: PostHogOptions & { fallbackDistinctId?: string }) {
    this.client = client;
    this._exceptionAutocaptureEnabled = options.enableExceptionAutocapture || false;
    this.fallbackDistinctId = options.fallbackDistinctId;

    this.startAutocaptureIfEnabled();
  }

  private startAutocaptureIfEnabled(): void {
    if (this.isEnabled()) {
      addUncaughtExceptionListener(this.onException.bind(this), this.onFatalError.bind(this));
      addUnhandledRejectionListener(this.onException.bind(this));
    }
  }

  private onException(exception: unknown, hint: EventHint): void {
    ErrorTracking.captureException(this.client, exception, hint, this.fallbackDistinctId);
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

/* eslint-disable @typescript-eslint/no-explicit-any */

// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License

import { PolymorphicEvent } from "./types";

export function isEvent(candidate: unknown): candidate is PolymorphicEvent {
  return typeof Event !== "undefined" && isInstanceOf(candidate, Event);
}

export function isPlainObject(candidate: unknown): candidate is Record<string, unknown> {
  return isBuiltin(candidate, "Object");
}

export function isError(candidate: unknown): candidate is Error {
  switch (Object.prototype.toString.call(candidate)) {
    case "[object Error]":
    case "[object Exception]":
    case "[object DOMException]":
    case "[object WebAssembly.Exception]":
      return true;
    default:
      return isInstanceOf(candidate, Error);
  }
}

export function isInstanceOf(candidate: unknown, base: any): boolean {
  try {
    return candidate instanceof base;
  } catch {
    return false;
  }
}

export function isErrorEvent(event: unknown): boolean {
  return isBuiltin(event, "ErrorEvent");
}

export function isBuiltin(candidate: unknown, className: string): boolean {
  return Object.prototype.toString.call(candidate) === `[object ${className}]`;
}

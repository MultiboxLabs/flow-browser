// Portions of this file are derived from getsentry/sentry-javascript by Software, Inc. dba Sentry
// Licensed under the MIT License

import { isError, isErrorEvent, isEvent, isPlainObject } from "./type-checking";
import {
  ErrorProperties,
  EventHint,
  Exception,
  Mechanism,
  StackFrame,
  StackFrameModifierFn,
  StackParser
} from "./types";

export async function propertiesFromUnknownInput(
  stackParser: StackParser,
  frameModifiers: StackFrameModifierFn[],
  input: unknown,
  hint?: EventHint
): Promise<ErrorProperties> {
  const providedMechanism = hint && hint.mechanism;
  const mechanism = providedMechanism || {
    handled: true,
    type: "generic"
  };

  const errorList = getErrorList(mechanism, input, hint);
  const exceptionList = await Promise.all(
    errorList.map(async (error) => {
      const exception = await exceptionFromError(stackParser, frameModifiers, error);
      exception.value = exception.value || "";
      exception.type = exception.type || "Error";
      exception.mechanism = mechanism;
      return exception;
    })
  );

  const properties = { $exception_list: exceptionList };
  return properties;
}

// Flatten error causes into a list of errors
// See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
function getErrorList(mechanism: Mechanism, input: unknown, hint?: EventHint): Error[] {
  const error = getError(mechanism, input, hint);
  if (error.cause) {
    return [error, ...getErrorList(mechanism, error.cause, hint)];
  }
  return [error];
}

function getError(mechanism: Mechanism, exception: unknown, hint?: EventHint): Error {
  if (isError(exception)) {
    return exception;
  }

  mechanism.synthetic = true;

  if (isPlainObject(exception)) {
    const errorFromProp = getErrorPropertyFromObject(exception);
    if (errorFromProp) {
      return errorFromProp;
    }

    const message = getMessageForObject(exception);
    const ex = hint?.syntheticException || new Error(message);
    ex.message = message;

    return ex;
  }

  // This handles when someone does: `throw "something awesome";`
  // We use synthesized Error here so we can extract a (rough) stack trace.
  const ex = hint?.syntheticException || new Error(exception as string);
  ex.message = `${exception}`;

  return ex;
}

/** If a plain object has a property that is an `Error`, return this error. */
function getErrorPropertyFromObject(obj: Record<string, unknown>): Error | undefined {
  for (const prop in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, prop)) {
      const value = obj[prop];
      if (isError(value)) {
        return value;
      }
    }
  }

  return undefined;
}

function getMessageForObject(exception: Record<string, unknown>): string {
  if ("name" in exception && typeof exception.name === "string") {
    let message = `'${exception.name}' captured as exception`;

    if ("message" in exception && typeof exception.message === "string") {
      message += ` with message '${exception.message}'`;
    }

    return message;
  } else if ("message" in exception && typeof exception.message === "string") {
    return exception.message;
  }

  const keys = extractExceptionKeysForMessage(exception);

  // Some ErrorEvent instances do not have an `error` property, which is why they are not handled before
  // We still want to try to get a decent message for these cases
  if (isErrorEvent(exception)) {
    return `Event \`ErrorEvent\` captured as exception with message \`${exception.message}\``;
  }

  const className = getObjectClassName(exception);

  return `${className && className !== "Object" ? `'${className}'` : "Object"} captured as exception with keys: ${keys}`;
}

function getObjectClassName(obj: unknown): string | undefined | void {
  try {
    const prototype: unknown | null = Object.getPrototypeOf(obj);
    return prototype ? prototype.constructor.name : undefined;
  } catch {
    // ignore errors here
  }
}

/**
 * Given any captured exception, extract its keys and create a sorted
 * and truncated list that will be used inside the event message.
 * eg. `Non-error exception captured with keys: foo, bar, baz`
 */
function extractExceptionKeysForMessage(exception: Record<string, unknown>, maxLength: number = 40): string {
  const keys = Object.keys(convertToPlainObject(exception));
  keys.sort();

  const firstKey = keys[0];

  if (!firstKey) {
    return "[object has no keys]";
  }

  if (firstKey.length >= maxLength) {
    return truncate(firstKey, maxLength);
  }

  for (let includedKeys = keys.length; includedKeys > 0; includedKeys--) {
    const serialized = keys.slice(0, includedKeys).join(", ");
    if (serialized.length > maxLength) {
      continue;
    }
    if (includedKeys === keys.length) {
      return serialized;
    }
    return truncate(serialized, maxLength);
  }

  return "";
}

function truncate(str: string, max: number = 0): string {
  if (typeof str !== "string" || max === 0) {
    return str;
  }
  return str.length <= max ? str : `${str.slice(0, max)}...`;
}

/**
 * Transforms any `Error` or `Event` into a plain object with all of their enumerable properties, and some of their
 * non-enumerable properties attached.
 *
 * @param value Initial source that we have to transform in order for it to be usable by the serializer
 * @returns An Event or Error turned into an object - or the value argument itself, when value is neither an Event nor
 *  an Error.
 */
function convertToPlainObject<V>(value: V):
  | {
      [ownProps: string]: unknown;
      type: string;
      target: string;
      currentTarget: string;
      detail?: unknown;
    }
  | {
      [ownProps: string]: unknown;
      message: string;
      name: string;
      stack?: string;
    }
  | V {
  if (isError(value)) {
    return {
      message: value.message,
      name: value.name,
      stack: value.stack,
      ...getOwnProperties(value)
    };
  } else if (isEvent(value)) {
    const newObj: {
      [ownProps: string]: unknown;
      type: string;
      target: string;
      currentTarget: string;
      detail?: unknown;
    } = {
      type: value.type,
      target: serializeEventTarget(value.target),
      currentTarget: serializeEventTarget(value.currentTarget),
      ...getOwnProperties(value)
    };

    // TODO: figure out why this fails typing (I think CustomEvent is only supported in Node 19 onwards)
    // if (typeof CustomEvent !== 'undefined' && isInstanceOf(value, CustomEvent)) {
    //   newObj.detail = (value as unknown as CustomEvent).detail
    // }

    return newObj;
  } else {
    return value;
  }
}

/** Filters out all but an object's own properties */
function getOwnProperties(obj: unknown): { [key: string]: unknown } {
  if (typeof obj === "object" && obj !== null) {
    const extractedProps: { [key: string]: unknown } = {};
    for (const property in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, property)) {
        extractedProps[property] = (obj as Record<string, unknown>)[property];
      }
    }
    return extractedProps;
  } else {
    return {};
  }
}

/** Creates a string representation of the target of an `Event` object */
function serializeEventTarget(target: unknown): string {
  try {
    return Object.prototype.toString.call(target);
  } catch {
    return "<unknown>";
  }
}

/**
 * Extracts stack frames from the error and builds an Exception
 */
async function exceptionFromError(
  stackParser: StackParser,
  frameModifiers: StackFrameModifierFn[],
  error: Error
): Promise<Exception> {
  const exception: Exception = {
    type: error.name || error.constructor.name,
    value: error.message
  };

  let frames = parseStackFrames(stackParser, error);

  for (const modifier of frameModifiers) {
    frames = await modifier(frames);
  }

  if (frames.length) {
    exception.stacktrace = { frames, type: "raw" };
  }

  return exception;
}

/**
 * Extracts stack frames from the error.stack string
 */
function parseStackFrames(stackParser: StackParser, error: Error): StackFrame[] {
  return stackParser(error.stack || "", 1);
}

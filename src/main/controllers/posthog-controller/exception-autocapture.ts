import { BucketedRateLimiter, ErrorTracking as CoreErrorTracking, createLogger } from "@posthog/core";
import { getSessionId } from "./session";
import { PostHog } from "posthog-node";

const SHUTDOWN_TIMEOUT_MS = 2000;

const logger = createLogger("[PostHog exception autocapture]");

type ErrorHandler = { _posthogErrorHandler: boolean } & ((error: Error) => void);

const errorPropertiesBuilder = new CoreErrorTracking.ErrorPropertiesBuilder(
  [
    new CoreErrorTracking.EventCoercer(),
    new CoreErrorTracking.ErrorCoercer(),
    new CoreErrorTracking.ObjectCoercer(),
    new CoreErrorTracking.StringCoercer(),
    new CoreErrorTracking.PrimitiveCoercer()
  ],
  CoreErrorTracking.createStackParser("node:javascript", CoreErrorTracking.nodeStackLineParser)
);

const rateLimiter = new BucketedRateLimiter<string>({
  refillRate: 1,
  bucketSize: 10,
  refillInterval: 10000,
  _logger: logger
});

function isPreviouslyCapturedError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "__posthog_previously_captured_error" in error &&
    error.__posthog_previously_captured_error === true
  );
}

async function buildExceptionEventMessage(
  exception: unknown,
  hint: CoreErrorTracking.EventHint,
  distinctId: string
) {
  const exceptionProperties = errorPropertiesBuilder.buildFromUnknown(exception, hint);
  exceptionProperties.$exception_list = await errorPropertiesBuilder.modifyFrames(exceptionProperties.$exception_list);

  return {
    event: "$exception",
    distinctId,
    properties: {
      ...exceptionProperties,
      $session_id: getSessionId()
    },
    _originatedFromCaptureException: true as const
  };
}

async function captureAutocapturedException(
  client: PostHog,
  exception: unknown,
  hint: CoreErrorTracking.EventHint,
  distinctId: string
): Promise<void> {
  if (isPreviouslyCapturedError(exception)) {
    return;
  }

  const eventMessage = await buildExceptionEventMessage(exception, hint, distinctId);

  const exceptionType = eventMessage.properties?.$exception_list?.[0]?.type ?? "Exception";
  const isRateLimited = rateLimiter.consumeRateLimit(exceptionType);
  if (isRateLimited) {
    logger.info("Skipping exception capture because of client rate limiting.", {
      exception: exceptionType
    });
    return;
  }

  client.capture(eventMessage);
}

function makeUncaughtExceptionHandler(
  captureFn: (exception: Error, hint: CoreErrorTracking.EventHint) => void,
  onFatalFn: (exception: Error) => void
): ErrorHandler {
  let calledFatalError = false;

  return Object.assign(
    (error: Error): void => {
      const userProvidedListenersCount = global.process.listeners("uncaughtException").filter((listener) => {
        return (
          listener.name !== "domainUncaughtExceptionClear" &&
          (listener as ErrorHandler)._posthogErrorHandler !== true
        );
      }).length;

      const processWouldExit = userProvidedListenersCount === 0;

      captureFn(error, {
        mechanism: {
          type: "onuncaughtexception",
          handled: false
        }
      });

      if (!calledFatalError && processWouldExit) {
        calledFatalError = true;
        onFatalFn(error);
      }
    },
    { _posthogErrorHandler: true }
  );
}

function addUncaughtExceptionListener(
  captureFn: (exception: Error, hint: CoreErrorTracking.EventHint) => void,
  onFatalFn: (exception: Error) => void
): void {
  global.process.on("uncaughtException", makeUncaughtExceptionHandler(captureFn, onFatalFn));
}

function addUnhandledRejectionListener(
  captureFn: (exception: unknown, hint: CoreErrorTracking.EventHint) => void
): void {
  global.process.on("unhandledRejection", (reason: unknown) => {
    captureFn(reason, {
      mechanism: {
        type: "onunhandledrejection",
        handled: false
      }
    });
  });
}

export function enableExceptionAutocapture(client: PostHog, distinctId: string): void {
  addUncaughtExceptionListener(
    (exception, hint) => {
      void captureAutocapturedException(client, exception, hint, distinctId);
    },
    async (error) => {
      console.error(error);
      await client.shutdown(SHUTDOWN_TIMEOUT_MS);
      process.exit(1);
    }
  );

  addUnhandledRejectionListener((reason, hint) => {
    void captureAutocapturedException(client, reason, hint, distinctId);
  });
}

import { PostHog } from "posthog-node";

type ErrorHandler = { _posthogErrorHandler: boolean } & ((error: Error) => void);

type EventHint = {
  mechanism: {
    type: "onuncaughtexception" | "onunhandledrejection";
    handled: false;
  };
};

function markErrorWithMechanism(error: unknown, hint: EventHint): unknown {
  if (error instanceof Error) {
    return Object.assign(error, {
      mechanism: hint.mechanism
    });
  }

  return error;
}

function makeUncaughtExceptionHandler(
  client: PostHog,
  distinctId: string,
  onFatalFn: (error: Error) => void
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

      client.captureException(markErrorWithMechanism(error, {
        mechanism: {
          type: "onuncaughtexception",
          handled: false
        }
      }), distinctId);

      if (!calledFatalError && processWouldExit) {
        calledFatalError = true;
        onFatalFn(error);
      }
    },
    { _posthogErrorHandler: true }
  );
}

export function enableExceptionAutocapture(client: PostHog, distinctId: string): void {
  global.process.on(
    "uncaughtException",
    makeUncaughtExceptionHandler(client, distinctId, async (error) => {
      console.error(error);
      await client.shutdown(2000);
      process.exit(1);
    })
  );

  global.process.on("unhandledRejection", (reason: unknown) => {
    client.captureException(markErrorWithMechanism(reason, {
      mechanism: {
        type: "onunhandledrejection",
        handled: false
      }
    }), distinctId);
  });
}

import ErrorTracking from "@/modules/error-capture";
import { SettingsDataStore } from "@/saving/settings";
import { app } from "electron";
import { PostHog } from "posthog-node";

const enableExceptionAutocapture = app.isPackaged;

const client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
  host: "https://eu.i.posthog.com",
  disableGeoip: false,
  enableExceptionAutocapture
});

// Anonymous ID
const ANON_ID_KEY = "posthog-anon-id";

async function cacheAnonUserId() {
  const anonUserId = await SettingsDataStore.get<string>(ANON_ID_KEY);
  if (!anonUserId) {
    const newAnonUserId = crypto.randomUUID();
    await SettingsDataStore.set(ANON_ID_KEY, newAnonUserId);
    return newAnonUserId;
  }
  return anonUserId;
}

let cachePromise: Promise<string>;
async function getAnonUserId() {
  if (!cachePromise) {
    cachePromise = cacheAnonUserId();
  }
  return await cachePromise;
}

// Identify user
getAnonUserId().then((anonUserId) => {
  client.identify({
    distinctId: anonUserId,
    properties: {
      ...getAppInfoForPosthog()
    }
  });
});

function getAppInfoForPosthog() {
  return {
    version: app.getVersion(),
    platform: process.platform,
    environment: process.env.NODE_ENV,
    locale: app.getLocale()
  };
}

// Capture event
export async function captureEvent(event: string, properties?: Record<string, unknown>) {
  const anonUserId = await getAnonUserId();
  client.capture({
    distinctId: anonUserId,
    event: event,
    properties: {
      ...properties
    }
  });
}

// Capture exception
export async function captureException(error: string, properties?: Record<string, unknown>) {
  const anonUserId = await getAnonUserId();
  client.captureException(error, anonUserId, {
    ...properties
  });
}

// Capture app started
captureEvent("app-started");

// Shutdown client on app quit
app.on("before-quit", () => {
  client.shutdown();
});

// Auto capture exceptions
getAnonUserId().then((anonUserId) => {
  new ErrorTracking(client, {
    fallbackDistinctId: anonUserId,
    enableExceptionAutocapture: true
  });
});

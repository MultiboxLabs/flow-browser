import { SettingsDataStore } from "@/saving/settings";
import { app } from "electron";
import { PostHog } from "posthog-node";

const client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
  host: "https://eu.i.posthog.com",
  enableExceptionAutocapture: true
});

async function getAnonUserId() {
  const anonUserId = await SettingsDataStore.get<string>("posthog-anon-id");
  if (!anonUserId) {
    const newAnonUserId = crypto.randomUUID();
    await SettingsDataStore.set("posthog-anon-id", newAnonUserId);
    return newAnonUserId;
  }
  return anonUserId;
}

function getAppInfoForPosthog() {
  return {
    version: app.getVersion(),
    platform: process.platform,
    environment: process.env.NODE_ENV
  };
}

export async function captureEvent(event: string, properties?: Record<string, unknown>) {
  const anonUserId = await getAnonUserId();
  client.capture({
    distinctId: anonUserId,
    event: event,
    properties: {
      ...properties,
      ...getAppInfoForPosthog()
    }
  });
}

export async function captureException(error: Error, properties?: Record<string, unknown>) {
  const anonUserId = await getAnonUserId();
  client.captureException(error, anonUserId, {
    ...properties,
    ...getAppInfoForPosthog()
  });
}

captureEvent("app-started");

app.on("before-quit", () => {
  client.shutdown();
});

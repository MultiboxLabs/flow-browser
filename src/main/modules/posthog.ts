import { SettingsDataStore } from "@/saving/settings";
import { app } from "electron";
import { PostHog } from "posthog-node";

export const client = new PostHog("phc_P8uPRRW5eJj8vMmgMlsgoOmmeNZ9NxBHN6COZQndvfZ", {
  host: "https://eu.i.posthog.com"
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

export async function captureEvent(event: string, properties?: Record<string, unknown>) {
  client.capture({
    distinctId: await getAnonUserId(),
    event: event,
    properties: {
      ...properties,
      version: app.getVersion(),
      platform: process.platform,
      environment: process.env.NODE_ENV
    }
  });
}

captureEvent("app-started");

app.on("before-quit", () => {
  client.shutdown();
});

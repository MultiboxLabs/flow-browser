import { sleep } from "@/modules/utils";
import { registerProtocolsWithSession } from "../protocols";
import { app, session } from "electron";
import { setupInterceptRules } from "@/controllers/sessions-controller/intercept-rules";
import { registerPreloadScripts } from "@/controllers/sessions-controller/preload-scripts";

function initializeDefaultSession() {
  const defaultSession = session.defaultSession;

  registerProtocolsWithSession(defaultSession, ["flow", "flow-internal", "flow-external"]);

  setupInterceptRules(defaultSession);
  registerPreloadScripts(defaultSession);
}

export let isDefaultSessionReady = false;

export const defaultSessionReady = app.whenReady().then(async () => {
  initializeDefaultSession();

  // wait for 50 ms before returning
  await sleep(50);

  // Set the flag to true
  isDefaultSessionReady = true;
});

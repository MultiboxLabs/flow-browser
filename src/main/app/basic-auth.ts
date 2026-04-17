import { app } from "electron";
import { tabsController } from "@/controllers/tabs-controller";
import { queuePrompt } from "@/modules/prompts";
import type { BasicAuthCredentials, PromptResult, PromptState } from "~/types/prompts";

export function setupBasicAuthHandler() {
  app.on("login", (event, webContents, details, authInfo, callback) => {
    if (!webContents) {
      callback();
      return;
    }

    const tabId = tabsController.getTabByWebContents(webContents)?.id;
    if (!tabId) {
      callback();
      return;
    }

    event.preventDefault();

    const { promise, resolve } = Promise.withResolvers<PromptResult<BasicAuthCredentials | null>>();

    const originUrl = String(details.url);
    const suppressionKey = `basic-auth:${tabId}:${authInfo.isProxy ? "proxy" : "server"}:${authInfo.host}:${authInfo.port}:${authInfo.realm}`;

    const state: PromptState = {
      id: "",
      type: "basic-auth",
      tabId,
      originUrl,
      suppressionKey,
      host: authInfo.host,
      port: authInfo.port,
      realm: authInfo.realm,
      scheme: authInfo.scheme,
      isProxy: authInfo.isProxy,
      promise,
      resolver: resolve
    };

    queuePrompt(state, {
      cancelOnWebFrameDetach: { webContents, webFrame: webContents.mainFrame }
    });

    void promise.then((result) => {
      if (result.success && result.result) {
        callback(result.result.username, result.result.password);
      } else {
        callback();
      }
    });
  });
}

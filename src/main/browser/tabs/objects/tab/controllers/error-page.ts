/*
TabErrorPageController:
- This controller is responsible for loading error pages
*/

import { Tab } from "@/browser/tabs/objects/tab";
import { FLAGS } from "@/modules/flags";

export class TabErrorPageController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;

    tab.on("webview-attached", () => {
      const webContents = tab.webview.webContents;
      if (!webContents) {
        return;
      }

      webContents.on("did-fail-load", (event, errorCode, _errorDescription, validatedURL, isMainFrame) => {
        event.preventDefault();

        // Skip aborted operations (user navigation cancellations)
        if (isMainFrame && errorCode !== -3) {
          this.loadErrorPage(errorCode, validatedURL);
        }
      });
    });
  }

  public loadErrorPage(errorCode: number, url: string) {
    // Errored on error page? Don't show another error page to prevent infinite loop
    const parsedURL = URL.parse(url);
    if (parsedURL && parsedURL.protocol === "flow:" && parsedURL.hostname === "error") {
      return;
    }

    // Craft error page URL
    const errorPageURL = new URL("flow://error");
    errorPageURL.searchParams.set("errorCode", errorCode.toString());
    errorPageURL.searchParams.set("url", url);
    errorPageURL.searchParams.set("initial", "1");

    // Load error page
    const replace = FLAGS.ERROR_PAGE_LOAD_MODE === "replace";
    this.tab.navigation.loadUrl(errorPageURL.toString(), replace);
  }
}

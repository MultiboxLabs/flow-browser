import { debugPrint } from "@/modules/output";
import { setAlwaysOpenExternal, shouldAlwaysOpenExternal } from "@/saving/open-external";
import { app, dialog, OpenExternalPermissionRequest, type Session } from "electron";

export function registerHandlersWithSession(session: Session) {
  session.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    debugPrint("PERMISSIONS", "permission request", webContents?.getURL() || "unknown-url", permission);

    if (permission === "openExternal") {
      const openExternalDetails = details as OpenExternalPermissionRequest;

      const requestingURL = openExternalDetails.requestingUrl;
      const externalURL = openExternalDetails.externalURL;

      if (openExternalDetails.externalURL) {
        const shouldAlwaysOpen = await shouldAlwaysOpenExternal(requestingURL, openExternalDetails.externalURL);
        if (shouldAlwaysOpen) {
          callback(true);
          return;
        }
      }

      const externalAppName =
        app.getApplicationNameForProtocol(openExternalDetails.externalURL ?? "") || "an unknown application";

      const url = new URL(openExternalDetails.requestingUrl);
      const minifiedUrl = `${url.protocol}//${url.host}`;

      dialog
        .showMessageBox({
          message: `"${minifiedUrl}" wants to open "${externalAppName}".`,
          buttons: ["Cancel", "Open", "Always Open"]
        })
        .then((response) => {
          switch (response.response) {
            case 2:
              if (externalURL) {
                setAlwaysOpenExternal(requestingURL, externalURL);
              }
            /* falls through */
            case 1:
              callback(true);
              break;
            case 0:
              callback(false);
              break;
          }
        });

      return;
    }

    callback(true);
  });
}

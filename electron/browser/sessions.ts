import { registerProtocolsWithSession } from "@/browser/utility/protocols";
import { debugPrint } from "@/modules/output";
import { setAlwaysOpenExternal, shouldAlwaysOpenExternal } from "@/saving/open-external";
import { getProfilePath } from "@/sessions/profiles";
import { app, dialog, OpenExternalPermissionRequest, session, Session } from "electron";

const sessions: Map<string, Session> = new Map();

function registerCallbacksWithSession(session: Session) {
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

function createSession(profileId: string) {
  const profileSessionPath = getProfilePath(profileId);
  const profileSession = session.fromPath(profileSessionPath);

  registerProtocolsWithSession(profileSession);
  registerCallbacksWithSession(profileSession);

  return profileSession;
}

export function getSession(profileId: string): Session {
  if (!sessions.has(profileId)) {
    const newSession = createSession(profileId);
    sessions.set(profileId, newSession);
  }

  return sessions.get(profileId) as Session;
}

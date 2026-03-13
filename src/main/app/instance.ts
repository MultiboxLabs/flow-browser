import { app } from "electron";
import { handleOpenUrl, isValidOpenerUrl } from "@/app/urls";
import { debugPrint } from "@/modules/output";
import { createIncognitoWindow } from "@/modules/incognito/windows";
import { FLAGS } from "@/modules/flags";

function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

function shouldCreateIncognitoWindow(args: string[]): boolean {
  return args.includes("--new-incognito-window");
}

export function setupSecondInstanceHandling() {
  app.on("second-instance", async (_event, commandLine) => {
    if (shouldCreateIncognitoWindow(commandLine) && FLAGS.INCOGNITO_ENABLED) {
      try {
        await createIncognitoWindow();
      } catch (error) {
        console.error("[Instance] Failed to create incognito window:", error);
      }
      return;
    }

    const url = commandLine.pop();
    if (url && isValidOpenerUrl(url)) {
      const shouldCreate = shouldCreateNewWindow(commandLine);
      handleOpenUrl(shouldCreate, url);
    }
  });

  debugPrint("INITIALIZATION", "second instance handler initialized");
}

import { app } from "electron";
import { handleOpenUrl, isValidOpenerUrl } from "@/app/urls";
import { debugPrint } from "@/modules/output";

function shouldCreateNewWindow(args: string[]): boolean {
  return args.includes("--new-window");
}

export function setupSecondInstanceHandling() {
  app.on("second-instance", async (_event, commandLine) => {
    const url = commandLine.pop();
    if (url && isValidOpenerUrl(url)) {
      const shouldCreate = shouldCreateNewWindow(commandLine);
      handleOpenUrl(shouldCreate, url);
    }
  });

  debugPrint("INITIALIZATION", "second instance handler initialized");
}

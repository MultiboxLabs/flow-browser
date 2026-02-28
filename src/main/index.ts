import { debugPrint } from "@/modules/output";
import { app } from "electron";

function printHeader() {
  if (!app.isPackaged) {
    console.log("\n".repeat(75));
  }

  console.log("\x1b[34m%s\x1b[0m", "--- Flow Browser ---");

  if (app.isPackaged) {
    console.log("\x1b[32m%s\x1b[0m", `Production Build (${app.getVersion()})`);
  } else {
    console.log("\x1b[31m%s\x1b[0m", `Development Build (${app.getVersion()})`);
  }

  console.log("");
}

function initializeApp() {
  const gotTheLock = app.requestSingleInstanceLock();
  debugPrint("INITIALIZATION", "gotTheLock", gotTheLock);

  if (!gotTheLock) {
    return false;
  }

  // Disable FedCM (Google One Tap, which doesn't work as the native prompt never shows in Electron)
  app.commandLine.appendSwitch("--disable-features", "FedCm");

  // Print header
  printHeader();

  // Import everything
  app.setActivationPolicy("regular");
  import("@/browser");

  return true;
}

// Start the application
const initialized = initializeApp();
if (!initialized) {
  app.quit();
}

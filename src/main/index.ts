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

  // Print header
  printHeader();

  // Import everything
  import("@/browser");

  return true;
}

// Start the application
const initialized = initializeApp();
if (!initialized) {
  app.quit();
}

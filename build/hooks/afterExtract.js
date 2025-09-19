import { removeWidevineSignature } from "./components/castlabs-evs.js";

// Set this to true if you're building for universal
const MACOS_IS_UNIVERSAL = true;

/** @type {(context: import("./types.js").PackContext) => void} */
export async function handler(context) {
  // Header
  console.log("\n---------");
  console.log("Executing afterExtract hook");

  // Remove `.sig` file which is causing universal builds to fail
  if (process.platform === "darwin" && MACOS_IS_UNIVERSAL) {
    await removeWidevineSignature(context.appOutDir)
      .then(() => true)
      .catch(() => false);
  }

  // Footer
  console.log("---------\n");
}

export default handler;

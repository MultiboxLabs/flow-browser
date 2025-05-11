import { signAppWithVMP } from "./components/castlabs-evs.js";

const vmpSignPlatforms = ["darwin"];

/** @type {(context: import("./types.js").PackContext) => void} */
export async function handler(context) {
  // Header
  console.log("\n---------");
  console.log("Executing afterPack hook");

  // macOS needs to VMP-sign the app before signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    await signAppWithVMP(context.appOutDir)
      .then(() => true)
      .catch(() => false);
  }

  // Footer
  console.log("---------\n");
}

export default handler;

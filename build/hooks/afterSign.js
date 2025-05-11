import { signAppWithVMP } from "./components/castlabs-evs.js";

const vmpSignPlatforms = ["win32"];

/** @type {(context: import("./types.js").PackContext) => void} */
export async function handler(context) {
  // Header
  console.log("\n---------");
  console.log("Executing afterSign hook");

  // Windows needs to VMP-sign the app after signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    await signAppWithVMP(context.appOutDir);
  }

  // Footer
  console.log("---------\n");
}

export default handler;

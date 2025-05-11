import { signAppWithVMP } from "./castlabs-evs.js";

const vmpSignPlatforms = ["darwin"];

export async function handler() {
  // Header
  console.log("\n---------");
  console.log("Executing afterPack hook");

  // macOS needs to VMP-sign the app before signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    await signAppWithVMP();
  }

  // Footer
  console.log("---------\n");
}

export default handler;

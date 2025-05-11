import { signAppWithVMP } from "./components/castlabs-evs.js";

const vmpSignPlatforms = ["win32"];

export async function handler() {
  // Header
  console.log("\n---------");
  console.log("Executing afterSign hook");

  // Windows needs to VMP-sign the app after signing it with Apple
  if (vmpSignPlatforms.includes(process.platform)) {
    await signAppWithVMP();
  }

  // Footer
  console.log("---------\n");
}

export default handler;

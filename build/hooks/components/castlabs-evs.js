// sign the app so WidevineCDM can work
// https://github.com/castlabs/electron-releases/wiki/EVS

import process from "process";
import path from "node:path";
import fs from "node:fs";
import { spawn } from "child_process";

/** @type {(appOutDir: string) => Promise<void>} */
async function signAppWithVMP(appOutDir) {
  let signPath = null;
  if (process.platform === "darwin") {
    signPath = appOutDir;
  } else if (process.platform === "win32") {
    signPath = appOutDir;
  }

  if (signPath) {
    console.log(`\nSigning the app for ${process.platform} in ${signPath}`);
    try {
      return new Promise((resolve, reject) => {
        const signProcess = spawn("python3", ["-m", "castlabs_evs.vmp", "--no-ask", "sign-pkg", signPath]);

        signProcess.stdout.on("data", (data) => {
          console.log(data.toString());
        });

        signProcess.stderr.on("data", (data) => {
          console.error(data.toString());
        });

        signProcess.on("close", (code) => {
          if (code === 0) {
            console.log("Signing completed successfully");
            resolve();
          } else {
            const error = new Error(`Signing process exited with code ${code}`);
            console.error(error.message);
            reject(error);
          }
        });

        signProcess.on("error", (error) => {
          console.error("Error in signing process:", error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error("Error starting signing process:", error.message);
      // Ignore errors, we can still build the app
      return Promise.resolve(); // Resolve anyway so build can continue
    }
  } else {
    console.log("\nSkipping signing the app, no signPath found\n");
    return Promise.resolve();
  }
}

/** @type {(appOutDir: string) => Promise<void>} */
async function removeWidevineSignature(appOutDir) {
  const sigFile = path.join(
    appOutDir,
    "Electron.app",
    "Contents/Frameworks/Electron Framework.framework/Versions/A/Resources",
    "Electron Framework.sig"
  );
  if (fs.existsSync(sigFile)) {
    console.log(`\nRemoving Development Widevine Signature`);
    console.log(`${sigFile}`);
    fs.unlinkSync(sigFile);
  } else {
    console.log(`\nNo Development Widevine Signature found`);
  }
}

export { signAppWithVMP, removeWidevineSignature };

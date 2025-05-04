import path from "path";
import { readFile, writeFile, unlink } from "fs/promises"; // Added unlink
import { exec } from "child_process";
import { app } from "electron"; // Assuming you're in an Electron context
import { PATHS } from "@/modules/paths";

// --- Configuration: Define your Application Details ---
// Best Practice: Get APP_NAME and APP_DESCRIPTION from your package.json
// or Electron's app module if possible (e.g., app.getName())
const APP_NAME_SHORT = "flow"; // CHANGE THIS: e.g., "myapp", "myeditor" (no spaces!)
const APP_NAME = app.getName(); // Or hardcode: "My Awesome App";
const APP_DESCRIPTION = "An experimental browser built on Electron."; // CHANGE THIS if needed

// --- Paths ---
// Ensure PATHS.ASSETS points to the directory containing the *new* script
// Make sure the new script is named "register_app_user.bat" in that directory
const scriptPath = path.join(PATHS.ASSETS, "default-app", "register_app_user.bat");
const appExecutablePath = process.execPath; // Path to your Electron app executable

// Use the temp directory for the temporary script file
const tempDir = app.getPath("temp");
const tempFile = path.join(tempDir, `register_${APP_NAME_SHORT}.bat`);

// --- Function to Register ---
export async function registerAppForCurrentUserOnWindows(): Promise<boolean> {
  console.log(`Attempting to register "${APP_NAME}" for the current user...`);
  console.log(`Using script: ${scriptPath}`);
  console.log(`App executable: ${appExecutablePath}`);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    let scriptContents: Buffer | string;
    try {
      // 1. Read the contents of the generic batch script
      scriptContents = await readFile(scriptPath); // Read as buffer or specify utf-8
      console.log(`Read script file: ${scriptPath}`);
    } catch (readError) {
      console.error(`Error reading script file at ${scriptPath}:`, readError);
      resolve(false);
      return;
    }

    try {
      // 2. Write the script contents to a temporary file
      await writeFile(tempFile, scriptContents);
      console.log(`Copied script to temporary file: ${tempFile}`);
    } catch (writeError) {
      console.error(`Error writing temporary script file to ${tempFile}:`, writeError);
      resolve(false);
      return;
    }

    // 3. Prepare arguments for the batch script
    //    Batch script uses %~1, %~2 etc which handle quotes, but PowerShell needs careful quoting.
    //    Using single quotes for PowerShell's ArgumentList items ensures each is treated as one argument,
    //    and triple quotes inside handle spaces within the argument for the batch script.
    const arg1 = `"""${appExecutablePath}"""`; // Path to exe
    const arg2 = `"${APP_NAME_SHORT}"`; // Short name (quotes optional if no spaces)
    const arg3 = `"""${APP_NAME}"""`; // Full name
    const arg4 = `"""${APP_DESCRIPTION}"""`; // Description

    // 4. Construct the execution command (NO -Verb Runas)
    //    Using Start-Process via PowerShell is generally robust for paths/args.
    //    -NoProfile and -ExecutionPolicy Bypass help avoid environment issues.
    const command = `Powershell -NoProfile -ExecutionPolicy Bypass -NoExit -Command "Start-Process -FilePath '${tempFile}' -ArgumentList ${arg1}, ${arg2}, ${arg3}, ${arg4}"`;

    console.log("Executing command:", command);

    // 5. Execute the command
    exec(command, async (err) => {
      if (err) {
        // Log the specific error from the exec call
        console.error("Error executing registration script:", err.message);
        resolve(false);
      } else {
        console.log(`Registration script executed successfully for "${APP_NAME}". Check Default Apps settings.`);
        resolve(true);
      }

      // 6. Clean up the temporary file (optional but recommended)
      try {
        await unlink(tempFile);
        console.log(`Deleted temporary script file: ${tempFile}`);
      } catch (unlinkError) {
        console.warn(`Could not delete temporary script file ${tempFile}:`, unlinkError);
      }
    });
  });
}

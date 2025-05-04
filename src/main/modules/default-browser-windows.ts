import path from "path";
import { readFile, writeFile, unlink } from "fs/promises";
import { exec } from "child_process";
import { app } from "electron"; // Assuming Electron context
import { PATHS } from "@/modules/paths";

// --- Configuration: Define your Application Details ---
const APP_NAME_SHORT = "flow"; // CHANGE THIS: e.g., "myapp", "myeditor" (no spaces!)
const APP_NAME = app.getName(); // Or hardcode: "My Awesome App";
const APP_DESCRIPTION = "An experimental browser built on Electron."; // CHANGE THIS if needed

// --- Association Data (from your JSON example) ---
const associations = {
  protocols: [
    {
      name: "HyperText Transfer Protocol",
      schemes: ["http", "https"]
    }
    // Add other protocols here if needed
    // { name: "File Transfer Protocol", schemes: ["ftp"] }
  ],
  fileAssociations: [
    { ext: "htm", name: "HyperText Markup File", role: "Viewer" },
    { ext: "html", description: "HTML Document", role: "Viewer" },
    { ext: "mhtml", description: "MHTML Document", role: "Viewer" },
    { ext: "shtml", name: "HyperText Markup File", role: "Viewer" },
    { ext: "xhtml", name: "Extensible HyperText Markup File", role: "Viewer" },
    { ext: "xhtm", name: "Extensible HyperText Markup File", role: "Viewer" },
    { ext: "pdf", description: "PDF Document", role: "Viewer" }
    // Add other file types here if needed
    // { ext: "txt", description: "Text Document", role: "Editor" }
  ]
};

// --- Paths ---
// Path to the *template* batch script
const scriptTemplatePath = path.join(
  PATHS.ASSETS, // Your assets path
  "default-app",
  "register_app_user_template.bat"
);
const appExecutablePath = process.execPath;
const tempDir = app.getPath("temp");
// Temporary file for the *finalized* script
const tempFile = path.join(tempDir, `register_${APP_NAME_SHORT}_final.bat`);

// --- Function to Register ---
export async function registerAppForCurrentUserOnWindows(): Promise<boolean> {
  console.log(`Attempting to register "${APP_NAME}" for the current user...`);
  console.log(`Using script template: ${scriptTemplatePath}`);
  console.log(`App executable: ${appExecutablePath}`);

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve) => {
    let scriptTemplate: string;
    try {
      // 1. Read the contents of the template batch script
      scriptTemplate = await readFile(scriptTemplatePath, "utf-8");
      console.log(`Read script template: ${scriptTemplatePath}`);
    } catch (readError) {
      console.error(`Error reading script template at ${scriptTemplatePath}:`, readError);
      resolve(false);
      return;
    }

    // 2. Generate File Association registry commands
    const fileAssocLines = associations.fileAssociations
      .map(
        (assoc) =>
          // Note: Registry paths need double backslashes in JS strings
          // The value name is the extension (e.g., ".html")
          // The value data points to the handler we defined (%APP_NAME_SHORT%File)
          `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\%APP_NAME_SHORT%\\Capabilities\\FileAssociations" /v ".${assoc.ext}" /t REG_SZ /d "%APP_NAME_SHORT%File" /f >nul`
      )
      .join("\r\n"); // Use Windows line endings for batch scripts

    // 3. Generate URL Association registry commands
    const urlAssocLines = associations.protocols
      .flatMap(
        (
          proto // Use flatMap to handle nested schemes array easily
        ) =>
          proto.schemes.map(
            (scheme) =>
              // The value name is the scheme (e.g., "http")
              // The value data points to the handler we defined (%APP_NAME_SHORT%URL)
              `reg add "HKCU\\Software\\Clients\\StartMenuInternet\\%APP_NAME_SHORT%\\Capabilities\\URLAssociations" /v "${scheme}" /t REG_SZ /d "%APP_NAME_SHORT%URL" /f >nul`
          )
      )
      .join("\r\n"); // Use Windows line endings

    // 4. Inject generated commands into the template
    let finalScriptContents = scriptTemplate.replace(
      "REM <<FILE_ASSOCIATIONS_PLACEHOLDER>>",
      fileAssocLines || "rem No file associations defined." // Add fallback comment
    );
    finalScriptContents = finalScriptContents.replace(
      "REM <<URL_ASSOCIATIONS_PLACEHOLDER>>",
      urlAssocLines || "rem No URL associations defined." // Add fallback comment
    );

    // --- Write and Execute Final Script ---
    try {
      // 5. Write the *finalized* script contents to the temporary file
      await writeFile(tempFile, finalScriptContents, "utf-8");
      console.log(`Generated final script to temporary file: ${tempFile}`);
    } catch (writeError) {
      console.error(`Error writing temporary script file to ${tempFile}:`, writeError);
      resolve(false);
      return;
    }

    // 6. Prepare arguments for the batch script
    const arg1 = `"""${appExecutablePath}"""`;
    const arg2 = `"${APP_NAME_SHORT}"`;
    const arg3 = `"""${APP_NAME}"""`;
    const arg4 = `"""${APP_DESCRIPTION}"""`;

    // 7. Construct the execution command (NO -Verb Runas)
    const command = `Powershell -NoProfile -ExecutionPolicy Bypass -Command "$result = Start-Process -FilePath '${tempFile}' -ArgumentList ${arg1}, ${arg2}, ${arg3}, ${arg4} -PassThru -Wait; Write-Host 'Process completed with exit code: ' $result.ExitCode; Write-Host 'Press any key to continue...';"`;

    console.log("Executing command:", command);

    // 8. Execute the command
    exec(command, async (err, stdout) => {
      if (err) {
        console.error("Error executing registration script:", err.message);
        resolve(false);
      } else {
        console.log(`Registration script executed successfully for "${APP_NAME}". Check Default Apps settings.`);
        console.log("Output:", stdout);
        resolve(true);
      }

      // 9. Clean up the temporary file
      try {
        await unlink(tempFile);
        console.log(`Deleted temporary script file: ${tempFile}`);
      } catch (unlinkError) {
        console.warn(`Could not delete temporary script file ${tempFile}:`, unlinkError);
      }
    });
  });
}

// --- Example Usage ---
/*
registerAppForCurrentUser().then(success => {
  if (success) {
    console.log("Application registration process completed successfully.");
  } else {
    console.error("Application registration process failed.");
  }
});
*/

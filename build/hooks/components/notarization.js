import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

/** @type {() => Promise<void>} */
async function createNotarizationApiKeyFile() {
  console.log("\nCreating notarization API key file");

  const apiKey = process.env["APPLE_API_KEY_DATA"];
  if (apiKey) {
    console.log("API key found");

    const tempDir = os.tmpdir();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const fileName = `notarization_auth_key_${randomStr}.p8`;
    const tempFilePath = path.join(tempDir, fileName);

    fs.writeFileSync(tempFilePath, apiKey);

    process.env["APPLE_API_KEY"] = tempFilePath;
    console.log(`API key file created at ${tempFilePath}`);
  } else {
    console.log("No API key found");
  }
}

export { createNotarizationApiKeyFile };

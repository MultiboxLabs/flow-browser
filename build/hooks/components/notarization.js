import fs from "fs";
import path from "path";
import os from "os";
import crypto from "crypto";

/** @type {() => Promise<void>} */
async function createNotarizationApiKeyFile() {
  const apiKey = process.env.APPLE_API_KEY_DATA;
  if (apiKey) {
    const tempDir = os.tmpdir();
    const randomStr = crypto.randomBytes(8).toString("hex");
    const fileName = `notarization_auth_key_${randomStr}.p8`;
    const tempFilePath = path.join(tempDir, fileName);

    fs.writeFileSync(tempFilePath, apiKey);

    process.env["APPLE_API_KEY"] = tempFilePath;
  }
}

export { createNotarizationApiKeyFile };

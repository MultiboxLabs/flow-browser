import { app } from "electron";
import fs from "fs";
import path from "path";
import os from "os";
import { FLOW_DATA_DIR } from "@/modules/paths";

function getAppLogPath() {
  const appName = app.getName();

  if (process.platform === "darwin") {
    return path.join(os.homedir(), "Library/Logs", appName);
  }

  return path.join(FLOW_DATA_DIR, "logs");
}

const appLogPath = getAppLogPath();

if (!fs.existsSync(appLogPath)) {
  fs.mkdirSync(appLogPath, { recursive: true });
}

// Get app version and format startup time for the log filename
const appVersion = app.getVersion();
const startupTime = new Date().toISOString().replace(/[:.]/g, "").slice(0, -1); // Format: YYYYMMDDTHHMMSSZ
const logFileName = `${appVersion}_${startupTime}.log`;

const logStream = fs.createWriteStream(path.join(appLogPath, logFileName), { flags: "a" });
const originalStdoutWrite = process.stdout.write;

type Callback = (err?: Error) => void;

function newStdoutWrite(
  chunk: Uint8Array | string,
  encodingOrCallback?: BufferEncoding | Callback,
  callback?: Callback
) {
  let decoloredChunk = chunk;
  if (typeof chunk === "string") {
    // remove ANSI escape codes
    // eslint-disable-next-line no-control-regex
    decoloredChunk = chunk.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
  }

  logStream.write(decoloredChunk);

  // @ts-expect-error: This is a workaround to log to the log file
  return originalStdoutWrite.call(process.stdout, chunk, encodingOrCallback, callback);
}
process.stdout.write = newStdoutWrite;

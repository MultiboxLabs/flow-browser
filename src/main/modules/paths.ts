import { is } from "@electron-toolkit/utils";
import { app } from "electron";
import path from "path";

// Constants
const ROOT_DIR = path.join(__dirname, "..");
const RESOURCES_DIR = process.resourcesPath;

// Development
const DEV_SOURCE_DIR = path.join(ROOT_DIR, "..");

// Paths
interface Paths {
  PRELOAD: string;
  VITE_WEBUI: string;
  ASSETS: string;
}

export const FLOW_DATA_DIR = app.getPath("userData");

export const PATHS: Paths = {
  PRELOAD: path.join(ROOT_DIR, "preload", "index.js"),
  VITE_WEBUI: path.join(ROOT_DIR, "renderer"),
  ASSETS: is.dev ? path.join(DEV_SOURCE_DIR, "assets") : path.join(RESOURCES_DIR, "assets")
};

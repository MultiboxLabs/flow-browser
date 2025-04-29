import { app } from "electron";
import path from "path";

// Constants
const OUT_DIR = path.join(__dirname, "..");
const ROOT_DIR = path.join(OUT_DIR, "..");

// Paths
interface Paths {
  PRELOAD: string;
  VITE_WEBUI: string;
  ASSETS: string;
}

export const FLOW_DATA_DIR = app.getPath("userData");

export const PATHS: Paths = {
  PRELOAD: path.join(OUT_DIR, "preload", "index.js"),
  VITE_WEBUI: path.join(OUT_DIR, "renderer"),
  ASSETS: path.join(ROOT_DIR, "assets")
};

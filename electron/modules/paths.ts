import { app } from "electron";
import path from "path";

// Constants
const FLOW_ROOT_DIR = path.join(__dirname, "../../");
const WEBPACK_ROOT_DIR = path.join(FLOW_ROOT_DIR, ".webpack");
const ROOT_DIR = path.join(FLOW_ROOT_DIR, "../");

// Paths
interface Paths {
  FLOW_ROOT_DIR: string;
  WEBPACK_ROOT_DIR: string;
  ROOT_DIR: string;
  ASSETS: string;
  VITE_WEBUI: string;
  PRELOAD: string;
  LOCAL_EXTENSIONS: string;
}

export const FLOW_DATA_DIR = app.getPath("userData");

export const PATHS: Paths = {
  FLOW_ROOT_DIR,
  WEBPACK_ROOT_DIR,
  ROOT_DIR,
  ASSETS: app.isPackaged
    ? path.resolve(process.resourcesPath as string, "assets")
    : path.resolve(FLOW_ROOT_DIR, "assets"),
  VITE_WEBUI: app.isPackaged ? path.resolve(process.resourcesPath, "ui") : path.resolve(ROOT_DIR, "vite", "dist"),
  PRELOAD: path.join(WEBPACK_ROOT_DIR, "renderer", "browser", "preload.js"),
  LOCAL_EXTENSIONS: path.join(ROOT_DIR, "extensions")
};

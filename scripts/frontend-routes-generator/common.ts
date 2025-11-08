import path from "path";
import fs from "fs/promises";

// Constants //
export const FRONTEND_PATH = path.resolve(__dirname, "..", "..", "src", "renderer");
export const ROUTES_PATH = path.join(FRONTEND_PATH, "src/routes");

// Helper Functions //
export const getDirectories = async (source: string) =>
  (await fs.readdir(source, { withFileTypes: true }))
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

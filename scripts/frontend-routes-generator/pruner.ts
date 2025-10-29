import path from "path";
import { FRONTEND_PATH, ROUTES_PATH, getDirectories } from "./common";
import fs from "fs/promises";

const emptyFn = () => {};

async function pruneRoutes() {
  // Grab all the routes
  const routes = await getDirectories(ROUTES_PATH);

  // Remove all the route-*.html files
  for (const route of routes) {
    const htmlPath = path.join(FRONTEND_PATH, `route-${route}.html`);
    await fs.rm(htmlPath).catch(emptyFn);
  }

  // Remove all the main.tsx files
  for (const route of routes) {
    const entrypointPath = path.join(ROUTES_PATH, route, "main.tsx");
    await fs.rm(entrypointPath).catch(emptyFn);
  }
}

pruneRoutes();

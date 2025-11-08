import path from "path";
import { FRONTEND_PATH, ROUTES_PATH, getDirectories } from "./common";
import fs from "fs/promises";

const emptyFn = () => {};

async function pruneRoutes() {
  // Grab all the routes
  const routes = await getDirectories(ROUTES_PATH);

  for (const route of routes) {
    // Remove all the route-*.html files
    const htmlPath = path.join(FRONTEND_PATH, `route-${route}.html`);
    await fs.rm(htmlPath).catch(emptyFn);

    // Remove all the main.tsx files
    const entrypointPath = path.join(ROUTES_PATH, route, "main.tsx");
    await fs.rm(entrypointPath).catch(emptyFn);
  }
}

pruneRoutes()
  .then(() => {
    console.log("Routes pruned successfully");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Failed to prune routes:", err);
    process.exit(1);
  });

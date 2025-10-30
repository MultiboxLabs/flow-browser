// Imports //
import path from "path";
import fs from "fs/promises";
import { FRONTEND_PATH, ROUTES_PATH, getDirectories } from "./common";

// Code //

export async function generateRoutes() {
  // Grab all the routes
  const routes = await getDirectories(ROUTES_PATH);

  // Create index.html files for each route
  for (const route of routes) {
    const htmlPath = path.join(FRONTEND_PATH, `route-${route}.html`);
    const content = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/x-icon" href="/assets/favicon.ico" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/routes/${route}/main.tsx"></script>
  </body>
</html>
`.trim();

    await fs.writeFile(htmlPath, content);
  }

  // Create main.tsx files for each route
  for (const route of routes) {
    const entrypointPath = path.join(ROUTES_PATH, route, "main.tsx");
    const content = `
import { PlatformProvider } from "@/components/main/platform";
import { UmamiScriptLoader } from "@/components/analytics/umami";
import { Fragment, StrictMode as ReactStrictMode } from "react";
import { Toaster } from "sonner";
import { createRoot } from "react-dom/client";
import { RouteConfig } from "./config";
import PageComponent from "./page";
import "../../index.css";

const STRICT_MODE_ENABLED = false;
const StrictMode = STRICT_MODE_ENABLED ? ReactStrictMode : Fragment;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlatformProvider>
      <RouteConfig.Providers>
        <PageComponent />
        <Toaster richColors />
        <UmamiScriptLoader />
      </RouteConfig.Providers>
    </PlatformProvider>
  </StrictMode>
);
`.trim();

    await fs.writeFile(entrypointPath, content);
  }

  // Return the routes as input for vite config
  const routesMap = new Map<string, string>();
  for (const route of routes) {
    routesMap.set(route, path.join(FRONTEND_PATH, `route-${route}.html`));
  }

  const routesInput = Object.fromEntries(routesMap.entries());
  return routesInput;
}

if (process.argv.includes("--run-as-script")) {
  generateRoutes()
    .then((routes) => {
      console.log("Generated frontend routes:", routes);
    })
    .catch((error) => {
      console.error("Error generating frontend routes:", error);
      process.exit(1);
    });
}

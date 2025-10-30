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
<!doctype html>
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
`;
    await fs.writeFile(htmlPath, content);
  }

  // Create main.tsx files for each route
  for (const route of routes) {
    const entrypointPath = path.join(ROUTES_PATH, route, "main.tsx");
    const content = `
import { Fragment, StrictMode as ReactStrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../index.css";
import Route from "./route";
import { PlatformProvider } from "@/components/main/platform";
import { QueryParamProvider } from "use-query-params";
import { WindowHistoryAdapter } from "use-query-params/adapters/window";
import { UmamiScriptLoader } from "@/components/analytics/umami";
import { Toaster } from "sonner";

const STRICT_MODE_ENABLED = false;
const StrictMode = STRICT_MODE_ENABLED ? ReactStrictMode : Fragment;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UmamiScriptLoader />

    <QueryParamProvider adapter={WindowHistoryAdapter}>
      <PlatformProvider>
        <Route />
        <Toaster richColors />
      </PlatformProvider>
    </QueryParamProvider>
  </StrictMode>
);
`;
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
  generateRoutes().then((routes) => {
    console.log("Generated frontend routes:", routes);
  });
}

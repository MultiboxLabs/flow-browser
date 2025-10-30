import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { generateRoutes } from "./scripts/frontend-routes-generator/generator";

const routes = await generateRoutes();

function isProductionBuild() {
  return process.env.PRODUCTION_BUILD === "true";
}

const mainAliases: Record<string, string> = {
  "@": resolve("src/main")
};

const rendererAliases: Record<string, string> = {
  "@": resolve("src/renderer/src")
};

const sharedAliases: Record<string, string> = {
  "~": resolve("src/shared")
};

const commonOptions = {
  build: {
    minify: isProductionBuild() ? "esbuild" : false
  }
} as const;

export default defineConfig({
  main: {
    ...commonOptions,
    plugins: [externalizeDepsPlugin({ exclude: ["electron-context-menu", "hono"] })],
    resolve: {
      alias: {
        ...mainAliases,
        ...sharedAliases
      }
    }
  },
  preload: {
    ...commonOptions,
    plugins: [externalizeDepsPlugin({ exclude: ["electron-chrome-extensions"] })],
    resolve: {
      alias: {
        ...mainAliases,
        ...sharedAliases
      }
    }
  },
  renderer: {
    ...commonOptions,
    resolve: {
      alias: {
        ...rendererAliases,
        ...sharedAliases
      }
    },
    build: {
      ...commonOptions.build,
      rollupOptions: {
        input: {
          ...routes
        }
      }
    },
    plugins: [react(), tailwindcss()]
  }
});

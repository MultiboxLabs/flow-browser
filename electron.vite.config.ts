import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const mainAliases: Record<string, string> = {
  "@": resolve("src/main")
};

const rendererAliases: Record<string, string> = {
  "@": resolve("src/renderer/src")
};

const sharedAliases: Record<string, string> = {
  "~": resolve("src/shared")
};

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin({ exclude: ["electron-context-menu"] })],
    resolve: {
      alias: {
        ...mainAliases,
        ...sharedAliases
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin({ exclude: ["electron-chrome-extensions"] })],
    resolve: {
      alias: {
        ...mainAliases,
        ...sharedAliases
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        ...rendererAliases,
        ...sharedAliases
      }
    },
    plugins: [react(), tailwindcss()]
  }
});

import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerFlatpak } from "@electron-forge/maker-flatpak";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { execSync } from "child_process";

import packageJson from "../package.json";
import { syncVersion } from "../scripts/sync-version";

function getPlatform(): string {
  if (process.platform === "win32") {
    return "win32";
  }

  return process.platform;
}

function getGitHash(): string | null {
  if (getPlatform() === "win32") {
    // Windows doesn't support non-numeric build versions
    return packageJson.version;
  }

  try {
    const fullHash = execSync("git rev-parse HEAD").toString().trim();
    return fullHash.slice(0, 7);
  } catch (error) {
    return packageJson.version;
  }
}

syncVersion();

const config: ForgeConfig = {
  packagerConfig: {
    name: "Flow",
    asar: true,
    extraResource: ["../vite/dist", "assets"],
    icon: "assets/AppIcon",
    appVersion: packageJson.version,
    buildVersion: getGitHash(),
    appCopyright: "© 2025 Multibox Labs"
  },
  rebuildConfig: {},
  makers: [
    // Windows
    new MakerSquirrel({
      name: "Flow",
      setupIcon: "./assets/AppIcon.ico",
      setupExe: "FlowSetup.exe"
    }),

    // MacOS
    new MakerDMG({
      title: "Flow Installer",
      icon: "./assets/AppIcon.icns"
    }),

    // Linux
    new MakerFlatpak({})
  ],
  plugins: [
    new WebpackPlugin({
      mainConfig: "./webpack.main.config.js",
      renderer: {
        config: "./webpack.renderer.config.js",
        entryPoints: [
          {
            name: "browser",
            preload: {
              js: "./preload.ts"
            }
          }
        ]
      },
      devServer: {
        client: {
          overlay: false
        }
      }
    }),
    new AutoUnpackNativesPlugin({})
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: "multiboxlabs",
        name: "flow-browser"
      },
      authToken: process.env.GITHUB_TOKEN,
      generateReleaseNotes: true,
      prerelease: true
    })
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      const fs = require("fs");
      const path = require("path");
      const { copySync } = require("fs-extra");

      const viteDistPath = path.resolve(__dirname, "../vite/dist");

      const destPath = path.join(buildPath, "dist");

      if (!fs.existsSync(path.dirname(destPath))) {
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
      }

      if (fs.existsSync(viteDistPath)) {
        console.log(`Copying Vite app from ${viteDistPath} to ${destPath}`);
        copySync(viteDistPath, destPath);
      } else {
        console.warn(`Vite app not found at ${viteDistPath}`);
      }
    }
  }
};

console.log(config.plugins);

export default config;

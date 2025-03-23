import type { ForgeConfig } from "@electron-forge/shared-types";
import { MakerDMG } from "@electron-forge/maker-dmg";
import { MakerSquirrel } from "@electron-forge/maker-squirrel";
import { MakerFlatpak } from "@electron-forge/maker-flatpak";
import { MakerDeb } from "@electron-forge/maker-deb";
import { MakerZIP } from "@electron-forge/maker-zip";
import { PublisherGithub } from "@electron-forge/publisher-github";
import { WebpackPlugin } from "@electron-forge/plugin-webpack";
import { AutoUnpackNativesPlugin } from "@electron-forge/plugin-auto-unpack-natives";
import { execSync } from "child_process";
import { rebuild } from "@electron/rebuild";

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

const externalModules = ["sharp", "knex", "better-sqlite3"];

// Helper function to recursively get dependencies
function getModuleDependencies(moduleName: string, seen = new Set<string>()): string[] {
  const fs = require("fs");
  const path = require("path");

  if (seen.has(moduleName)) return [];
  seen.add(moduleName);

  // Handle path differently for scoped packages (@namespace/package)
  const isScoped = moduleName.startsWith("@");
  let modulePath;

  if (isScoped) {
    // For scoped packages, we need to ensure the namespace directory exists
    const [scope, name] = moduleName.split("/");
    modulePath = path.join(__dirname, "../node_modules", scope, name);
  } else {
    modulePath = path.join(__dirname, "../node_modules", moduleName);
  }

  const packageJsonPath = path.join(modulePath, "package.json");

  if (!fs.existsSync(packageJsonPath)) return [];

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    // Include both dependencies and optionalDependencies
    const dependencies = Object.keys(packageJson.dependencies || {});
    const optionalDependencies = Object.keys(packageJson.optionalDependencies || {});
    const allDependencies = [...dependencies, ...optionalDependencies];

    const result = [...allDependencies];

    for (const dep of allDependencies) {
      const subDeps = getModuleDependencies(dep, seen);
      result.push(...subDeps);
    }

    return result;
  } catch (error) {
    console.warn(`Error reading dependencies for ${moduleName}:`, error);
    return [];
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    name: "Flow",
    executableName: "flow-browser",
    asar: {
      unpack: "**/node_modules/@img/**/*"
    },
    extraResource: ["../vite/dist", "assets"],
    icon: "assets/AppIcon",
    appVersion: packageJson.version,
    buildVersion: getGitHash(),
    appCopyright: "© 2025 Multibox Labs"
  },
  rebuildConfig: {
    mode: "parallel"
  },
  makers: [
    // Windows
    new MakerSquirrel({
      name: "Flow",
      setupIcon: "./assets/AppIcon.ico",
      setupExe: "FlowSetup.exe"
    }),

    // MacOS
    new MakerDMG({
      name: "FlowInstaller",
      title: "Flow Installer",
      icon: "./assets/AppIcon.icns"
    }),

    // Linux
    new MakerFlatpak({}),
    new MakerDeb({
      options: {
        productName: "Flow"
      }
    }),

    // Universal
    new MakerZIP({})
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

      // Copy external modules
      const externalModulesPath = path.resolve(__dirname, "../node_modules");
      const destExternalModulesPath = path.join(buildPath, "node_modules");

      if (fs.existsSync(externalModulesPath)) {
        console.log(`Copying external modules from ${externalModulesPath} to ${destExternalModulesPath}`);

        // Get all modules and their dependencies
        const allModulesToCopy = new Set(externalModules);

        // Add dependencies of each external module
        for (const module of externalModules) {
          const dependencies = getModuleDependencies(module);
          dependencies.forEach((dep) => allModulesToCopy.add(dep));
        }

        console.log(`Copying ${allModulesToCopy.size} modules (including dependencies)`);

        // Copy all modules
        for (const module of allModulesToCopy) {
          let modulePath;
          let destModulePath;

          if (module.startsWith("@")) {
            // Handle scoped packages
            const [scope, name] = module.split("/");

            // If it's just the scope (@namespace), copy the entire scope directory
            if (!name) {
              modulePath = path.join(externalModulesPath, scope);
              destModulePath = path.join(destExternalModulesPath, scope);
            } else {
              modulePath = path.join(externalModulesPath, scope, name);
              destModulePath = path.join(destExternalModulesPath, scope, name);

              // Ensure the scope directory exists in destination
              const destScopePath = path.join(destExternalModulesPath, scope);
              if (!fs.existsSync(destScopePath)) {
                fs.mkdirSync(destScopePath, { recursive: true });
              }
            }
          } else {
            modulePath = path.join(externalModulesPath, module);
            destModulePath = path.join(destExternalModulesPath, module);
          }

          if (fs.existsSync(modulePath)) {
            console.log(`Copying ${module} to ${destModulePath}`);
            copySync(modulePath, destModulePath);
          }
        }

        /* In theory, rebuildConfig should handle this already. If it doesn't, re-enable this.
        // Rebuild native modules for Electron
        try {
          console.log(`Rebuilding native modules for Electron ${electronVersion}`);

          // First, ensure package.json exists in the build directory
          const packageJsonPath = path.resolve(__dirname, "../package.json");
          const destPackageJsonPath = path.join(buildPath, "package.json");

          if (!fs.existsSync(destPackageJsonPath) && fs.existsSync(packageJsonPath)) {
            console.log(`Copying package.json to ${destPackageJsonPath}`);
            fs.copyFileSync(packageJsonPath, destPackageJsonPath);
          }

          await rebuild({
            buildPath: buildPath,
            electronVersion,
            arch,
            force: true,
            onlyModules: Array.from(allModulesToCopy).filter((module) => {
              // Only include modules that have native dependencies
              const modulePath = path.join(buildPath, "node_modules", module);
              return (
                fs.existsSync(path.join(modulePath, "binding.gyp")) ||
                fs.existsSync(path.join(modulePath, "build/Release")) ||
                fs.existsSync(path.join(modulePath, "prebuilds"))
              );
            })
          });
          console.log("Electron rebuild completed successfully");
        } catch (error) {
          console.error("Failed to rebuild native modules:", error);
        }
      */
      }
    }
  }
};

export default config;

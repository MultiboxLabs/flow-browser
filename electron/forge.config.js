module.exports = {
  packagerConfig: {
    name: "Flow",
    asar: true,
    extraResource: ["../vite/dist", "assets"],
    icon: "assets/AppIcon",
    appCopyright: "© 2025 Multibox Labs"
  },
  rebuildConfig: {},
  makers: [
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin", "win32"]
    },
    {
      name: "@electron-forge/maker-dmg",
      platforms: ["darwin"]
    },
    {
      name: "@electron-forge/maker-deb",
      platforms: ["linux"]
    }
  ],
  plugins: [
    {
      name: "@electron-forge/plugin-webpack",
      config: {
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
      }
    },
    {
      name: "@electron-forge/plugin-auto-unpack-natives",
      config: {}
    }
  ].filter(Boolean),
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

import type { Configuration } from "electron-builder";

// Helper Functions //
/**
 * Get the custom app version from environment variables.
 * @returns The custom app version from environment variables, or undefined if not provided
 */
function getCustomAppVersion(): string | undefined {
  return process.env.CUSTOM_APP_VERSION;
}

// Options //
const customAppVersion = getCustomAppVersion();
if (customAppVersion) {
  console.log(`Using custom version: ${customAppVersion}`);
}

// Main Configuration //
const electronBuilderConfig: Configuration = {
  appId: "dev.iamevan.flow",
  productName: "Flow",
  ...(customAppVersion && { buildVersion: customAppVersion, extraMetadata: { version: customAppVersion } }),
  directories: {
    buildResources: "build"
  },
  files: [
    "!**/.vscode/*",
    "!build/**",
    "!src/*",
    "!electron.vite.config.{js,ts,mjs,cjs}",
    "!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc,dev-app-update.yml}",
    "!{CHANGELOG.md,README.md,CONTRIBUTING.md,docs/**}",
    "!{scripts/**}",
    "!{.env,.env.*,.npmrc,bun.lock}",
    "!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}"
  ],
  protocols: [
    {
      name: "HyperText Transfer Protocol",
      schemes: ["http", "https"]
    }
  ],
  fileAssociations: [
    {
      ext: "htm",
      name: "HyperText Markup File",
      role: "Viewer"
    },
    {
      ext: "html",
      description: "HTML Document",
      role: "Viewer"
    },
    {
      ext: "mhtml",
      description: "MHTML Document",
      role: "Viewer"
    },
    {
      ext: "shtml",
      name: "HyperText Markup File",
      role: "Viewer"
    },
    {
      ext: "xhtml",
      name: "Extensible HyperText Markup File",
      role: "Viewer"
    },
    {
      ext: "xhtm",
      name: "Extensible HyperText Markup File",
      role: "Viewer"
    },
    {
      ext: "pdf",
      description: "PDF Document",
      role: "Viewer"
    }
  ],
  asarUnpack: ["assets/**", "node_modules/@img/**"],
  win: {
    executableName: "flow",
    verifyUpdateCodeSignature: false
  },
  nsis: {
    artifactName: "${name}-${version}-setup.${ext}",
    shortcutName: "${productName}",
    uninstallDisplayName: "${productName}",
    createDesktopShortcut: "always"
  },
  mac: {
    category: "public.app-category.productivity",
    entitlementsInherit: "./build/entitlements.mac.plist",
    notarize: true,
    extendInfo: {
      CFBundleIconName: "AppIcon"
    }
  },
  dmg: {
    artifactName: "${name}-${version}-${arch}.${ext}",
    background: "./build/dmg-background.tiff",
    icon: "./build/volume-icon.icns"
  },
  linux: {
    target: ["AppImage", "deb", "flatpak"],
    category: "Network;WebBrowser;",
    executableArgs: ["--ozone-platform-hint=auto"],
    icon: "icon.png"
  },
  appImage: {
    artifactName: "${name}-${version}-${arch}.${ext}"
  },
  flatpak: {
    artifactName: "${name}-${version}-${arch}.${ext}"
  },
  npmRebuild: false,
  publish: {
    provider: "github",
    owner: "multiboxlabs",
    releaseType: "prerelease"
  },
  electronDist: "node_modules/electron/dist",
  afterPack: "./build/hooks/afterPack.js",
  afterSign: "./build/hooks/afterSign.js"
};

export default electronBuilderConfig;

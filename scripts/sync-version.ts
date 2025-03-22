import fs from "fs";
import path from "path";

export function syncVersion() {
  try {
    // Read the root package.json
    const rootPackagePath = path.join(__dirname, "../package.json");
    const rootPackageContent = fs.readFileSync(rootPackagePath, "utf8");
    const rootPackage = JSON.parse(rootPackageContent);
    const version = rootPackage.version;

    if (!version) {
      console.error("No version found in root package.json");
      process.exit(1);
    }

    // Update backend package.json
    const backendPackagePath = path.join(__dirname, "../electron/package.json");
    const backendPackageContent = fs.readFileSync(backendPackagePath, "utf8");
    const backendPackage = JSON.parse(backendPackageContent);
    backendPackage.version = version;
    fs.writeFileSync(backendPackagePath, JSON.stringify(backendPackage, null, 2) + "\n");

    console.log(`Successfully synced version ${version} across all package.json files`);
  } catch (error) {
    console.error("Error syncing versions:", error);
    process.exit(1);
  }
}

// If running directly as a script
if (require.main === module) {
  syncVersion();
}

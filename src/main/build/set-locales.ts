import fs from "fs";
import path from "path";
import { sync as rimrafSync } from "rimraf";

type Platform = "darwin" | "mas" | "win32" | "linux" | string;

function getLanguageFolderPath(givenPath: string, platform: Platform): string {
  switch (platform) {
    case "darwin":
    case "mas":
      return path.resolve(givenPath, "..");

    case "win32":
    case "linux":
      return path.resolve(givenPath, "..", "..", "locales");

    default:
      return path.resolve(givenPath);
  }
}

function getLanguageFileExtension(platform: Platform): string {
  switch (platform) {
    case "darwin":
    case "mas":
      return "lproj";

    case "win32":
    case "linux":
      return "pak";

    default:
      return "";
  }
}

function walkLanguagePaths(dir: string, platform: Platform): string[] {
  const regex = new RegExp(`.(${getLanguageFileExtension(platform)})$`);
  const paths = fs.readdirSync(dir);

  switch (platform) {
    case "darwin":
    case "mas":
      return paths.filter(
        (currentPath) => fs.statSync(path.resolve(dir, currentPath)).isDirectory() && regex.test(currentPath)
      );

    case "win32":
    case "linux":
      return paths;

    default:
      return [];
  }
}

interface SetLanguagesOptions {
  allowRemovingAll?: boolean;
}

export default function setLanguages(languages: string[], { allowRemovingAll = false }: SetLanguagesOptions = {}) {
  return function electronPackagerLanguages(
    buildPath: string,
    electronVersion: string,
    platform: Platform,
    arch: string,
    callback: () => void
  ): void {
    const resourcePath = getLanguageFolderPath(buildPath, platform);
    const includedLanguages = languages.map((l) => `${l}.${getLanguageFileExtension(platform)}`);
    const languageFolders = walkLanguagePaths(resourcePath, platform);
    const excludedFolders = languageFolders.filter((langFolder) => !includedLanguages.includes(langFolder));

    if (allowRemovingAll !== true && excludedFolders.length === languageFolders.length) {
      throw new Error(
        "electron-packager-languages: Refusing to remove all languages from the packaged app! Double check the supplied locale identifiers or suppress this error via the 'allowRemovingAll' option."
      );
    }

    console.log(`Removing ${excludedFolders.length} of ${languageFolders.length} languages from the packaged app.`);
    excludedFolders.forEach((langFolder) => {
      try {
        rimrafSync(path.resolve(resourcePath, langFolder));
      } catch (error) {
        console.error(`Failed to remove language folder ${langFolder}:`, error);
      }
    });
    callback();
  };
}

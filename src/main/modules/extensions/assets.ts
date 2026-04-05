import { loadedProfilesController } from "@/controllers/loaded-profiles-controller";
import { getContentType, getFsStat } from "@/modules/utils";
import { Extension, Session } from "electron";
import fs from "fs/promises";
import path from "path";

export type ExtensionAsset = {
  buffer: Buffer;
  contentType: string;
  path: string;
};

export type GetExtensionAssetOptions = {
  requireWebAccessibleFor?: string;
  session?: Session;
};

const MAX_PATTERN_LENGTH = 2048;
const MAX_WILDCARDS = 32;

function findLoadedExtension(extensionId: string, session?: Session): Extension | null {
  if (session) {
    return session.extensions.getExtension(extensionId) ?? null;
  }

  for (const loadedProfile of loadedProfilesController.getAll()) {
    const extension = loadedProfile.session.extensions.getExtension(extensionId);
    if (extension) {
      return extension;
    }
  }

  return null;
}

function sanitizeAssetPath(assetPath: string): string | null {
  const pathWithoutSearch = assetPath.split(/[?#]/, 1)[0];
  if (!pathWithoutSearch) {
    return null;
  }

  try {
    const decodedPath = decodeURIComponent(pathWithoutSearch);
    if (decodedPath.includes("\0")) {
      return null;
    }

    return decodedPath.replaceAll("\\", "/").replace(/^\/+/, "");
  } catch {
    return null;
  }
}

function resolveExtensionAssetPath(extensionPath: string, assetPath: string): string | null {
  const sanitizedAssetPath = sanitizeAssetPath(assetPath);
  if (!sanitizedAssetPath) {
    return null;
  }

  const resolvedPath = path.resolve(extensionPath, sanitizedAssetPath);
  const relativePath = path.relative(extensionPath, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return null;
  }

  return resolvedPath;
}

function escapePattern(pattern: string) {
  return pattern.replace(/[\\^$+?.()|[\]{}]/g, "\\$&");
}

function matchesWildcardPattern(pattern: string, value: string) {
  const normalizedPattern = pattern.replace(/\*+/g, "*");
  const wildcardCount = normalizedPattern.match(/\*/g)?.length ?? 0;

  if (normalizedPattern.length > MAX_PATTERN_LENGTH || wildcardCount > MAX_WILDCARDS) {
    return false;
  }

  if (normalizedPattern === "*") {
    return true;
  }

  const regexp = new RegExp(`^${normalizedPattern.split("*").map(escapePattern).join(".*")}$`);
  return regexp.test(value);
}

function isSameExtensionOrigin(extension: Extension, requestUrl: string) {
  try {
    const url = new URL(requestUrl);
    return url.protocol === "chrome-extension:" && url.hostname === extension.id;
  } catch {
    return false;
  }
}

function isWebAccessibleForOrigin(extension: Extension, assetPath: string, requestUrl: string) {
  if (isSameExtensionOrigin(extension, requestUrl)) {
    return true;
  }

  const manifest: chrome.runtime.Manifest = extension.manifest;
  const sanitizedAssetPath = sanitizeAssetPath(assetPath);
  if (!sanitizedAssetPath) {
    return false;
  }

  if (manifest.manifest_version === 2) {
    const resources = manifest.web_accessible_resources ?? [];
    return resources.some((pattern) => matchesWildcardPattern(pattern, sanitizedAssetPath));
  }

  if (manifest.manifest_version === 3) {
    const resources = manifest.web_accessible_resources ?? [];

    return resources.some((entry) => {
      const resourceAllowed = entry.resources.some((pattern) => matchesWildcardPattern(pattern, sanitizedAssetPath));
      if (!resourceAllowed) {
        return false;
      }

      if ("extension_ids" in entry && entry.extension_ids) {
        try {
          const url = new URL(requestUrl);
          return (
            url.protocol === "chrome-extension:" &&
            (entry.extension_ids.includes("*") || entry.extension_ids.includes(url.hostname))
          );
        } catch {
          return false;
        }
      }

      return entry.matches?.some((pattern) => {
        if (pattern === "<all_urls>") {
          return true;
        }

        return matchesWildcardPattern(pattern, requestUrl);
      });
    });
  }

  return false;
}

async function isPathInsideRoot(rootPath: string, targetPath: string) {
  const [realRootPath, realTargetPath] = await Promise.all([fs.realpath(rootPath), fs.realpath(targetPath)]);
  const relativePath = path.relative(realRootPath, realTargetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

export async function getExtensionAsset(
  extensionId: string,
  assetPath: string,
  options: GetExtensionAssetOptions = {}
): Promise<ExtensionAsset | null> {
  const extension = findLoadedExtension(extensionId, options.session);
  if (!extension) {
    return null;
  }

  if (
    options.requireWebAccessibleFor &&
    !isWebAccessibleForOrigin(extension, assetPath, options.requireWebAccessibleFor)
  ) {
    return null;
  }

  const resolvedAssetPath = resolveExtensionAssetPath(extension.path, assetPath);
  if (!resolvedAssetPath) {
    return null;
  }

  const stats = await getFsStat(resolvedAssetPath);
  if (!stats?.isFile()) {
    return null;
  }

  const isInsideExtensionRoot = await isPathInsideRoot(extension.path, resolvedAssetPath).catch(() => false);
  if (!isInsideExtensionRoot) {
    return null;
  }

  const buffer = await fs.readFile(resolvedAssetPath);
  return {
    buffer,
    contentType: getContentType(resolvedAssetPath).toString(),
    path: resolvedAssetPath
  };
}

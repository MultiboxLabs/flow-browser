/**
 * TypeScript interfaces for Bun.lock file structure
 * Based on the JSON schema for Bun's package manager lockfile
 * See https://bun.sh/docs/install/lockfile
 */

/**
 * Base information about a package, including dependencies and peer relationships.
 */
export interface BunLockFileBasePackageInfo {
  /** A map of dependencies required by this package */
  dependencies?: Record<string, string>;
  /** A map of development-only dependencies */
  devDependencies?: Record<string, string>;
  /** A map of optional dependencies for this package */
  optionalDependencies?: Record<string, string>;
  /** A map of peer dependencies for this package */
  peerDependencies?: Record<string, string>;
  /** An array of optional peer dependencies */
  optionalPeers?: string[];
  /** Executable binaries provided by the package */
  bin?: Record<string, string> | string;
  /** Directory where the package's binaries are located */
  binDir?: string;
}

/**
 * Information specific to workspace packages.
 */
export interface BunLockFileWorkspacePackage extends BunLockFileBasePackageInfo {
  /** The name of the workspace package */
  name?: string;
  /** The version of the workspace package */
  version?: string;
}

/**
 * Detailed information about a specific package.
 */
export interface BunLockFilePackageInfo extends BunLockFileBasePackageInfo {
  /** Specifies operating systems supported by this package */
  os?: string | string[];
  /** Specifies CPU architectures supported by this package */
  cpu?: string | string[];
  /** Indicates if the package is bundled */
  bundled?: true;
}

/**
 * Root package binary information
 */
export interface BunLockFileRootPackageBin {
  /** Executable binaries provided by the root package */
  bin?: Record<string, string> | string;
  /** Directory where the root package's binaries are located */
  binDir?: string;
}

/**
 * An array representing a package in the lockfile.
 * Can represent different types of packages: npm, symlink/folder/tarball, workspace, git/GitHub, or root.
 */
export type BunLockFilePackageArray =
  | [string, string, BunLockFilePackageInfo, string] // npm package: [name@version, registry, metadata, integrity]
  | [string, BunLockFilePackageInfo] // symlink/folder/tarball: [name with path, metadata]
  | [string] // workspace package: [name with workspace path]
  | [string, BunLockFilePackageInfo, string] // git/GitHub: [name with git prefix, metadata, bun tag]
  | [string, BunLockFileRootPackageBin]; // root package: [name@root:, bin info]

/**
 * Schema definition for Bun's `bun.lock` file (package manager lockfile).
 */
export interface BunLock {
  /** Specifies the version of the lockfile format. Currently only supporting 0 or 1 */
  lockfileVersion: 0 | 1;
  /** Defines the project workspaces and their corresponding packages */
  workspaces: Record<string, BunLockFileWorkspacePackage>;
  /** Contains information about all the packages used in the project */
  packages: Record<string, BunLockFilePackageArray>;
  /** Defines custom dependency resolutions for specific packages */
  overrides?: Record<string, string>;
  /** Lists dependencies that have been patched to modify their behavior */
  patchedDependencies?: Record<string, string>;
  /** An array of dependencies explicitly marked as trusted */
  trustedDependencies?: string[];
}

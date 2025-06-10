/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * TypeScript interfaces for NPM package.json files
 * Based on the JSON schema for package.json
 * See https://json.schemastore.org/package.json
 */

/**
 * A person who has been involved in creating or maintaining this package.
 */
export type Person =
  | string
  | {
      name: string;
      url?: string;
      email?: string;
    };

/**
 * Dependencies are specified with a simple hash of package name to version range.
 */
export type Dependency = Record<string, string>;

/**
 * Development dependencies for the project.
 */
export type DevDependency = Record<string, string>;

/**
 * Optional dependencies for the project.
 */
export type OptionalDependency = Record<string, string>;

/**
 * Peer dependencies required by the package.
 */
export type PeerDependency = Record<string, string>;

/**
 * Metadata for peer dependencies.
 */
export type PeerDependencyMeta = Record<
  string,
  {
    /** Specifies that this peer dependency is optional and should not be installed automatically */
    optional?: boolean;
    [key: string]: any;
  }
>;

/**
 * SPDX license identifier or custom license string.
 */
export type License =
  | "AGPL-3.0-only"
  | "Apache-2.0"
  | "BSD-2-Clause"
  | "BSD-3-Clause"
  | "BSL-1.0"
  | "CC0-1.0"
  | "CDDL-1.0"
  | "CDDL-1.1"
  | "EPL-1.0"
  | "EPL-2.0"
  | "GPL-2.0-only"
  | "GPL-3.0-only"
  | "ISC"
  | "LGPL-2.0-only"
  | "LGPL-2.1-only"
  | "LGPL-2.1-or-later"
  | "LGPL-3.0-only"
  | "LGPL-3.0-or-later"
  | "MIT"
  | "MPL-2.0"
  | "MS-PL"
  | "UNLICENSED"
  | (string & {});

/**
 * Package exports entry path.
 */
export type PackageExportsEntryPath = string | null;

/**
 * Package exports entry object for conditional exports.
 */
export interface PackageExportsEntryObject {
  /** The module path for CommonJS require() */
  require?: PackageExportsEntryOrFallback;
  /** The module path for ES module import */
  import?: PackageExportsEntryOrFallback;
  /** The module path for Node.js environment */
  node?: PackageExportsEntryOrFallback;
  /** The default module path */
  default?: PackageExportsEntryOrFallback;
  /** The module path for TypeScript types */
  types?: PackageExportsEntryOrFallback;
  /** Custom environment conditions */
  [condition: string]: PackageExportsEntryOrFallback | undefined;
}

/**
 * Package exports entry.
 */
export type PackageExportsEntry = PackageExportsEntryPath | PackageExportsEntryObject;

/**
 * Package exports fallback array.
 */
export type PackageExportsFallback = PackageExportsEntry[];

/**
 * Package exports entry or fallback.
 */
export type PackageExportsEntryOrFallback = PackageExportsEntry | PackageExportsFallback;

/**
 * Package imports entry path.
 */
export type PackageImportsEntryPath = string | null;

/**
 * Package imports entry object for conditional imports.
 */
export interface PackageImportsEntryObject {
  /** The module path for CommonJS require() */
  require?: PackageImportsEntryOrFallback;
  /** The module path for ES module import */
  import?: PackageImportsEntryOrFallback;
  /** The module path for Node.js environment */
  node?: PackageImportsEntryOrFallback;
  /** The default module path */
  default?: PackageImportsEntryOrFallback;
  /** The module path for TypeScript types */
  types?: PackageImportsEntryOrFallback;
  /** Custom environment conditions */
  [condition: string]: PackageImportsEntryOrFallback | undefined;
}

/**
 * Package imports entry.
 */
export type PackageImportsEntry = PackageImportsEntryPath | PackageImportsEntryObject;

/**
 * Package imports fallback array.
 */
export type PackageImportsFallback = PackageImportsEntry[];

/**
 * Package imports entry or fallback.
 */
export type PackageImportsEntryOrFallback = PackageImportsEntry | PackageImportsFallback;

/**
 * Funding URL.
 */
export type FundingUrl = string;

/**
 * Funding information.
 */
export interface FundingWay {
  url: string;
  /** The type of funding platform, e.g. patreon, opencollective, tidelift, github */
  type?: string;
}

/**
 * Development engine dependency.
 */
export interface DevEngineDependency {
  /** The name of the dependency */
  name: string;
  /** The version range for the dependency */
  version?: string;
  /** What action to take if validation fails */
  onFail?: "ignore" | "warn" | "error" | "download";
}

/**
 * Package.json scripts configuration.
 */
export interface Scripts {
  /** Run code quality tools, e.g. ESLint, TSLint */
  lint?: string;
  /** Run BEFORE the package is published */
  prepublish?: string;
  /** Runs BEFORE the package is packed */
  prepare?: string;
  /** Run BEFORE the package is prepared and packed, ONLY on npm publish */
  prepublishOnly?: string;
  /** Run BEFORE a tarball is packed */
  prepack?: string;
  /** Run AFTER the tarball has been generated */
  postpack?: string;
  /** Publishes a package to the registry */
  publish?: string;
  /** Run AFTER the package is published */
  postpublish?: string;
  /** Run BEFORE the package is installed */
  preinstall?: string;
  /** Run AFTER the package is installed */
  install?: string;
  /** Run AFTER the package is installed */
  postinstall?: string;
  /** Run BEFORE the package is uninstalled */
  preuninstall?: string;
  /** Run BEFORE the package is uninstalled */
  uninstall?: string;
  /** Run AFTER the package is uninstalled */
  postuninstall?: string;
  /** Run BEFORE bump the package version */
  preversion?: string;
  /** Run BEFORE bump the package version */
  version?: string;
  /** Run AFTER bump the package version */
  postversion?: string;
  /** Run by the 'npm test' command */
  pretest?: string;
  /** Run by the 'npm test' command */
  test?: string;
  /** Run by the 'npm test' command */
  posttest?: string;
  /** Run by the 'npm stop' command */
  prestop?: string;
  /** Run by the 'npm stop' command */
  stop?: string;
  /** Run by the 'npm stop' command */
  poststop?: string;
  /** Run by the 'npm start' command */
  prestart?: string;
  /** Run by the 'npm start' command */
  start?: string;
  /** Run by the 'npm start' command */
  poststart?: string;
  /** Run by the 'npm restart' command */
  prerestart?: string;
  /** Run by the 'npm restart' command */
  restart?: string;
  /** Run by the 'npm restart' command */
  postrestart?: string;
  /** Start dev server to serve application files */
  serve?: string;
  /** Custom scripts */
  [script: string]: string | undefined;
}

/**
 * Package directories configuration.
 */
export interface Directories {
  /** Directory for executable binaries */
  bin?: string;
  /** Directory for documentation */
  doc?: string;
  /** Directory for example scripts */
  example?: string;
  /** Directory for library code */
  lib?: string;
  /** Directory for man pages */
  man?: string;
  /** Directory for tests */
  test?: string;
}

/**
 * Repository information.
 */
export type Repository =
  | string
  | {
      type?: string;
      url?: string;
      directory?: string;
    };

/**
 * Funding information.
 */
export type Funding = FundingUrl | FundingWay | (FundingUrl | FundingWay)[];

/**
 * Package exports configuration.
 */
export type Exports =
  | PackageExportsEntryPath
  | {
      "."?: PackageExportsEntryOrFallback;
      [path: string]: PackageExportsEntryOrFallback | undefined;
    }
  | PackageExportsEntryObject
  | PackageExportsFallback;

/**
 * Package imports configuration.
 */
export type Imports = {
  [importPath: `#${string}`]: PackageImportsEntryOrFallback;
};

/**
 * Workspaces configuration.
 */
export type Workspaces =
  | string[]
  | {
      packages?: string[];
      nohoist?: string[];
    };

/**
 * Development engines configuration.
 */
export interface DevEngines {
  /** Operating system requirements */
  os?: DevEngineDependency | DevEngineDependency[];
  /** CPU architecture requirements */
  cpu?: DevEngineDependency | DevEngineDependency[];
  /** C standard library requirements */
  libc?: DevEngineDependency | DevEngineDependency[];
  /** JavaScript runtime requirements */
  runtime?: DevEngineDependency | DevEngineDependency[];
  /** Package manager requirements */
  packageManager?: DevEngineDependency | DevEngineDependency[];
}

/**
 * Publish configuration.
 */
export interface PublishConfig {
  access?: "public" | "restricted";
  tag?: string;
  registry?: string;
  provenance?: boolean;
  [key: string]: any;
}

/**
 * Distribution information.
 */
export interface Dist {
  shasum?: string;
  tarball?: string;
}

/**
 * ESNext module configuration.
 */
export type ESNext =
  | string
  | {
      main?: string;
      browser?: string;
      [key: string]: string | undefined;
    };

/**
 * PNPM-specific configuration.
 */
export interface PnpmConfig {
  /** Override dependency resolutions */
  overrides?: Record<string, any>;
  /** Extend package definitions */
  packageExtensions?: Record<
    string,
    {
      dependencies?: Dependency;
      optionalDependencies?: OptionalDependency;
      peerDependencies?: PeerDependency;
      peerDependenciesMeta?: PeerDependencyMeta;
    }
  >;
  /** Peer dependency rules */
  peerDependencyRules?: {
    ignoreMissing?: string[];
    allowedVersions?: Record<string, any>;
    allowAny?: string[];
  };
  /** Dependencies that should never be built */
  neverBuiltDependencies?: string[];
  /** Only these dependencies are allowed to run build scripts */
  onlyBuiltDependencies?: string[];
  /** JSON file listing allowed build dependencies */
  onlyBuiltDependenciesFile?: string;
  /** Dependencies to ignore during build */
  ignoredBuiltDependencies?: string[];
  /** Allowed deprecated versions */
  allowedDeprecatedVersions?: Record<string, any>;
  /** Patched dependencies */
  patchedDependencies?: Record<string, any>;
  /** Allow non-applied patches */
  allowNonAppliedPatches?: boolean;
  /** Update configuration */
  updateConfig?: {
    ignoreDependencies?: string[];
  };
  /** Configuration dependencies */
  configDependencies?: Record<string, any>;
  /** Audit configuration */
  auditConfig?: {
    ignoreCves?: string[];
    ignoreGhsas?: string[];
  };
  /** Required scripts */
  requiredScripts?: string[];
  /** Supported architectures */
  supportedArchitectures?: {
    os?: string[];
    cpu?: string[];
    libc?: string[];
  };
  /** Ignored optional dependencies */
  ignoredOptionalDependencies?: string[];
  /** Execution environment */
  executionEnv?: {
    nodeVersion?: string;
  };
}

/**
 * StackBlitz configuration.
 */
export interface StackBlitzConfig {
  /** Automatically install npm dependencies */
  installDependencies?: boolean;
  /** Terminal command to execute after installing dependencies */
  startCommand?: string | boolean;
  /** How file changes trigger compilation */
  compileTrigger?: "auto" | "keystroke" | "save";
  /** Default environment variables */
  env?: Record<string, any>;
}

/**
 * Main Package.json interface.
 */
export interface PackageJson {
  /** The name of the package */
  name?: string;
  /** Version must be parsable by node-semver */
  version?: string;
  /** Package description for npm search */
  description?: string;
  /** Keywords for package discovery */
  keywords?: string[];
  /** URL to the project homepage */
  homepage?: string;
  /** Bug reporting information */
  bugs?:
    | string
    | {
        url?: string;
        email?: string;
      };
  /** License for the package */
  license?: License;
  /** DEPRECATED: Use license field instead */
  licenses?: Array<{
    type?: License;
    url?: string;
  }>;
  /** Package author */
  author?: Person;
  /** Package contributors */
  contributors?: Person[];
  /** Package maintainers */
  maintainers?: Person[];
  /** Files to include in the package */
  files?: string[];
  /** Main entry point module */
  main?: string;
  /** Package exports */
  exports?: Exports;
  /** Package imports */
  imports?: Imports;
  /** Executable binaries */
  bin?: string | Record<string, string>;
  /** Module type: commonjs or module */
  type?: "commonjs" | "module";
  /** TypeScript declaration file */
  types?: string;
  /** TypeScript declaration file (synonym for types) */
  typings?: string;
  /** TypeScript version-specific types */
  typesVersions?: Record<
    string,
    {
      "*"?: string[];
      [path: string]: string[] | undefined;
    }
  >;
  /** Man pages */
  man?: string | string[];
  /** Directory configuration */
  directories?: Directories;
  /** Repository information */
  repository?: Repository;
  /** Funding information */
  funding?: Funding;
  /** Package scripts */
  scripts?: Scripts;
  /** Configuration parameters */
  config?: Record<string, any>;
  /** Production dependencies */
  dependencies?: Dependency;
  /** Development dependencies */
  devDependencies?: DevDependency;
  /** Optional dependencies */
  optionalDependencies?: OptionalDependency;
  /** Peer dependencies */
  peerDependencies?: PeerDependency;
  /** Peer dependency metadata */
  peerDependenciesMeta?: PeerDependencyMeta;
  /** Bundle dependencies */
  bundleDependencies?: string[] | boolean;
  /** DEPRECATED: Use bundleDependencies */
  bundledDependencies?: string[] | boolean;
  /** Yarn resolutions */
  resolutions?: Record<string, any>;
  /** NPM overrides */
  overrides?: Record<string, any>;
  /** Package manager specification */
  packageManager?: string;
  /** Engine requirements */
  engines?: {
    node?: string;
    [engine: string]: string | undefined;
  };
  /** Volta configuration */
  volta?: {
    extends?: string;
    [tool: string]: string | undefined;
  };
  /** DEPRECATED: Engine strict mode */
  engineStrict?: boolean;
  /** Supported operating systems */
  os?: string[];
  /** Supported CPU architectures */
  cpu?: string[];
  /** Development engines */
  devEngines?: DevEngines;
  /** DEPRECATED: Prefer global installation */
  preferGlobal?: boolean;
  /** Private package flag */
  private?: boolean | "true" | "false";
  /** Publish configuration */
  publishConfig?: PublishConfig;
  /** Distribution information */
  dist?: Dist;
  /** README content */
  readme?: string;
  /** ECMAScript module entry point */
  module?: string;
  /** ESNext entry point */
  esnext?: ESNext;
  /** Workspace configuration */
  workspaces?: Workspaces;
  /** JSPM configuration */
  jspm?: PackageJson;
  /** ESLint configuration */
  eslintConfig?: any;
  /** Prettier configuration */
  prettier?: any;
  /** Stylelint configuration */
  stylelint?: any;
  /** AVA test runner configuration */
  ava?: any;
  /** Semantic release configuration */
  release?: any;
  /** JSCPD configuration */
  jscpd?: any;
  /** PNPM configuration */
  pnpm?: PnpmConfig;
  /** StackBlitz configuration */
  stackblitz?: StackBlitzConfig;
  /** Custom properties starting with _ */
  [customProperty: `_${string}`]: any;
}

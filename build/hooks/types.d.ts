import { PlatformPackager, Target } from "app-builder-lib";
import { Arch } from "electron-builder";

// https://www.electron.build/app-builder-lib.interface.packcontext
export interface PackContext {
  readonly appOutDir: string;
  readonly arch: Arch;
  readonly electronPlatformName: string;
  readonly outDir: string;
  readonly packager: PlatformPackager;
  readonly targets: Target[];
}

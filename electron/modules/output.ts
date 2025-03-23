import { FLAGS } from "./flags";

const DEBUG_AREAS = {
  FAVICONS: false, // @/modules/favicons.ts
  PERMISSIONS: false, // @/browser/main.ts
  VITE_UI_EXTENSION: false, // @/browser/main.ts
  EXTENSION_SERVER_WORKERS: false, // @/browser/main.ts
  WEB_CONTENTS_CREATED: false // @/browser/main.ts
} as const;

export type DEBUG_AREA = keyof typeof DEBUG_AREAS;

export function debugPrint(area: DEBUG_AREA, ...message: string[]) {
  if (!FLAGS.SHOW_DEBUG_PRINTS) return;

  if (DEBUG_AREAS[area]) {
    console.log(`\x1b[32m[${area}]\x1b[0m`, ...message);
  }
}

export function debugError(area: DEBUG_AREA, ...message: string[]) {
  if (FLAGS.SHOW_DEBUG_ERRORS === false) return;

  if (Array.isArray(FLAGS.SHOW_DEBUG_ERRORS)) {
    if (!FLAGS.SHOW_DEBUG_ERRORS.includes(area)) return;
  }

  console.error(`\x1b[31m[${area}]\x1b[0m`, ...message);
}

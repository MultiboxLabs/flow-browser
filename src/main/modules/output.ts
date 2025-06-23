/* eslint-disable @typescript-eslint/no-explicit-any */

import { FLAGS } from "./flags";
import "@/modules/logs";

const DEBUG_AREAS = {
  INITIALIZATION: true, // @/main/index.ts
  FAVICONS: false, // @/modules/favicons.ts
  PERMISSIONS: false, // @/browser/main.ts
  VITE_UI_EXTENSION: false, // @/browser/main.ts
  EXTENSION_SERVER_WORKERS: false, // @/browser/main.ts
  WEB_CONTENTS_CREATED: false, // @/browser/main.ts
  OMNIBOX: false, // @/browser/omnibox.ts
  DATASTORE: false, // @/saving/datastore.ts
  PROFILES: false, // @/modules/profiles.ts
  SPACES: false, // @/sessions/spaces.ts
  ICONS: false, // @/modules/icons.ts
  PORTAL_COMPONENTS: false, // @/browser/components/portal-component-windows.ts
  AUTO_UPDATER: false, // @/modules/auto-update.ts
  CONTENT_BLOCKER: false, // @/modules/content-blocker.ts
  WEB_REQUESTS_INTERCEPTION: false, // @/browser/utility/web-requests.ts
  WEB_REQUESTS: false, // @/browser/utility/web-requests.ts
  MATCH_PATTERN: false // @/browser/utility/match-pattern.ts
} as const;

export type DEBUG_AREA = keyof typeof DEBUG_AREAS;

export function debugPrint(area: DEBUG_AREA, ...message: any[]) {
  if (!FLAGS.SHOW_DEBUG_PRINTS) return;

  if (DEBUG_AREAS[area]) {
    console.log(`\x1b[32m[${area}]\x1b[0m`, ...message);
  }
}

export function debugError(area: DEBUG_AREA, ...message: any[]) {
  if (FLAGS.SHOW_DEBUG_ERRORS === false) return;

  if (Array.isArray(FLAGS.SHOW_DEBUG_ERRORS)) {
    if (!FLAGS.SHOW_DEBUG_ERRORS.includes(area)) return;
  }

  console.error(`\x1b[31m[${area}]\x1b[0m`, ...message);
}

import { app } from "electron";
import { DEBUG_AREA } from "./output";

type Flags = {
  SCRUBBED_USER_AGENT: boolean;
  ERROR_PAGE_LOAD_MODE: "replace" | "load";
  SHOW_DEBUG_PRINTS: boolean;
  SHOW_DEBUG_ERRORS: boolean | DEBUG_AREA[];
  DEBUG_DISABLE_TAB_VIEW: boolean;
  DEBUG_HOT_RELOAD_FRONTEND: boolean;
  SHOW_DEBUG_DEVTOOLS: boolean;
  GLANCE_ENABLED: boolean;
  FAVICONS_REMOVE_PATH: boolean;
};

export const FLAGS: Flags = {
  // Disabled, because it causes cloudflare turnstile to flag us.
  // It also causes Google to flag us as a bot, which stops us from logging in to Google.
  // Current Solution: Remove Electron user agent, but keep app user agent.
  // Don't know how long this will work though...
  SCRUBBED_USER_AGENT: false,

  // Replace - Use window.location.replace to load the error page.
  // Load - Add the page to the history stack by loading it normally.
  ERROR_PAGE_LOAD_MODE: "replace",

  // Debug: Prints & Errors
  SHOW_DEBUG_PRINTS: true,
  SHOW_DEBUG_ERRORS: true,
  SHOW_DEBUG_DEVTOOLS: !app.isPackaged,

  // Debug: Disable the tab view
  DEBUG_DISABLE_TAB_VIEW: false,

  // Debug: Enable the hot reload feature for frontend (Experimental / Unstable)
  DEBUG_HOT_RELOAD_FRONTEND: true,

  // Glance: Enable the glance feature
  GLANCE_ENABLED: false,

  // Favicons: Remove the path from the favicon URL
  FAVICONS_REMOVE_PATH: true
};

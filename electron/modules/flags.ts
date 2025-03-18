type Flags = {
  SCRUBBED_USER_AGENT: boolean;
  ERROR_PAGE_LOAD_MODE: "replace" | "load";
  DEBUG_DISABLE_TAB_VIEW: boolean;
};

export const FLAGS: Flags = {
  // Disabled, because it causes cloudflare turnstile to flag us.
  SCRUBBED_USER_AGENT: false,

  // Replace - Use window.location.replace to load the error page.
  // Load - Add the page to the history stack by loading it normally.
  ERROR_PAGE_LOAD_MODE: "replace",

  // Debug: Disable the tab view
  DEBUG_DISABLE_TAB_VIEW: false
};

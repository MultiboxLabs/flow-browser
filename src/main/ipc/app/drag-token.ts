// One-use drag token for cross-window tab drag-and-drop authentication.
//
// When an external drag starts, the source renderer generates a random token
// and registers it here via IPC alongside the tab ID being dragged. Only one
// token is active at a time — registering a new one replaces any previous one.
//
// When the drop target calls tabs:move-tab-to-window-space with a dragToken,
// validateAndConsumeToken is called to verify the token matches the registered
// tab and then immediately clears it so it cannot be reused.

interface ActiveDragToken {
  token: string;
  tabId: number;
}

let activeToken: ActiveDragToken | null = null;

/**
 * Registers a new one-use drag token tied to a specific tab.
 * Any previously registered token is discarded.
 */
export function registerToken(token: string, tabId: number): void {
  activeToken = { token, tabId };
}

/**
 * Validates the provided token against the active token and, if valid,
 * consumes it so it cannot be used again. Returns true only if the token
 * matches and is bound to the expected tab ID.
 */
export function validateAndConsumeToken(token: string, tabId: number): boolean {
  if (!activeToken) return false;
  if (activeToken.token !== token || activeToken.tabId !== tabId) return false;
  activeToken = null;
  return true;
}

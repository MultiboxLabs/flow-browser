// Eagerly fetch the session drag token from the main process once at module
// load time. Because getInitialDataForExternal() is called synchronously when
// a drag starts, the token must be available synchronously by that point.
//
// In practice the IPC round-trip resolves long before the user can begin
// dragging, so cachedToken will always be set. If for some reason it is not
// yet resolved, getSessionDragToken() returns undefined and the receiving
// window will reject the payload — a safe fail-closed behavior.

let cachedToken: string | undefined;

flow.app.getDragToken().then((token) => {
  cachedToken = token;
});

/**
 * Returns the session drag token synchronously once it has been fetched,
 * or undefined if the fetch has not yet completed.
 */
export function getSessionDragToken(): string | undefined {
  return cachedToken;
}

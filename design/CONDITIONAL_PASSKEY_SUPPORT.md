# Conditional Passkey (Autofill) Support

## Status: Implementation

## Overview

When a website calls `navigator.credentials.get({ mediation: "conditional" })`, Flow Browser
will query available passkeys via `electron-webauthn`'s `listPasskeys(rpId)`, monitor focus
events on `<input autocomplete="webauthn">` fields, and show a dropdown overlay (rendered as
a PortalComponent, like find-in-page) near the focused input. On passkey selection, it
completes authentication using the existing `getCredential()` with `allowedCredentials` set to
the selected credential.

### Key Decisions

| Decision             | Choice                                                    | Rationale                                                        |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Trigger event        | **Focus** (not hover)                                     | Matches WebAuthn spec + Chrome/Safari behavior                   |
| Scroll behavior      | **Close on scroll**                                       | Matches Chrome autofill; avoids continuous IPC position updates  |
| Unsupported platform | **Return false** from `isConditionalMediationAvailable()` | Graceful degradation; websites fall back to non-conditional flow |

### Dependencies

- `electron-webauthn@^1.2.0` — provides `listPasskeys(relyingPartyId: string)`
- macOS 13.3+ (Ventura) required for `listPasskeys()` at the OS level
- Apple entitlement `com.apple.developer.web-browser.public-key-credential` (already present)

---

## Data Flow

```
Website calls credentials.get({ mediation: "conditional" })
    |
    v
Tab preload: intercepts, calls ipcRenderer.invoke("webauthn:get", options)
  (long-lived promise -- does not resolve until user selects or cancels)
    |
    v
Main process: detects conditional, calls listPasskeys(rpId)
    |
    v
Main process: stores pending session, sends passkey list to tab preload
    |
    v
Tab main world: sets up MutationObserver + focus listeners
  for <input autocomplete="webauthn"> fields
    |
    v
User focuses a webauthn input
    |
    v
Tab main world: getBoundingClientRect() -> ipcRenderer.send(
  "webauthn:conditional-input-focus", rect)
    |
    v
Main process: computes window-relative position (tab bounds + input rect)
  -> sendMessageToCoreWebContents("webauthn:conditional-show-overlay",
     { passkeys, position })
    |
    v
Browser chrome: PasskeyOverlay component renders dropdown via PortalComponent
    |
    v
User clicks a passkey
    |
    v
Browser chrome: ipcRenderer.send("webauthn:conditional-select", credentialId)
    |
    v
Main process: calls getCredential() with allowedCredentials = [{ id: selected }]
  -> resolves the pending long-lived promise
    |
    v
Tab preload: invoke resolves -> maps result to PublicKeyCredential
  -> returns to website
```

---

## Layer-by-Layer Changes

### 1. Shared Types

**New file: `src/shared/flow/interfaces/browser/passkey-overlay.ts`**

```typescript
import type { IPCListener } from "~/flow/types";

export interface PasskeyCredentialInfo {
  id: string; // base64url credential ID
  rpId: string;
  userName: string;
  userHandle: string;
}

export interface PasskeyOverlayPosition {
  x: number; // window-relative
  y: number;
  width: number;
  height: number;
}

export interface FlowPasskeyOverlayAPI {
  onShow: IPCListener<[{ passkeys: PasskeyCredentialInfo[]; position: PasskeyOverlayPosition }]>;
  onHide: IPCListener<[void]>;
  select: (credentialId: string) => void;
  dismiss: () => void;
}
```

**Modify: `src/shared/flow/flow.ts`**

Add `passkeyOverlay: FlowPasskeyOverlayAPI` to the `flow` global type declaration.

---

### 2. Main Process IPC (`src/main/ipc/webauthn/`)

#### a) Modify `webauthn:get` handler

Remove the early `"NotSupportedError"` rejection for `mediation === "conditional"`.
When conditional:

1. Call `listPasskeys(rpId)` via the webauthn module.
2. If no passkeys found or `listPasskeys` fails → return `"NotAllowedError"`.
3. If passkeys found → store a pending session in a
   `Map<number, ConditionalSession>` keyed by tab `webContents.id`, containing:
   - The Promise `resolve` / `reject`
   - The original `publicKeyOptions`
   - The passkey list
   - The sender `webContents` reference
   - The `BrowserWindow` reference
   - Origin / frame metadata (for the later `getCredential` call)
4. Send the passkey list to the **tab's webContents** via
   `event.sender.send("webauthn:conditional-passkeys", passkeys)`.
5. Return a long-lived `Promise` (resolves only when user selects or cancels).

#### b) New handler: `webauthn:conditional-input-focus` (from tab preload)

- Receives `{ x, y, width, height }` — viewport-relative input rect from the tab.
- Looks up the tab via `tabsController.getTabByWebContents(event.sender)`.
- Gets the tab's current bounds from `TabBoundsController.bounds`.
- Computes window-relative overlay position:
  ```
  overlayX = tabBounds.x + inputRect.x
  overlayY = tabBounds.y + inputRect.y + inputRect.height
  overlayWidth = max(inputRect.width, OVERLAY_MIN_WIDTH)
  ```
- Sends to browser chrome:
  `window.sendMessageToCoreWebContents("webauthn:conditional-show-overlay",
{ passkeys, position })`.

#### c) New handler: `webauthn:conditional-input-blur` (from tab preload)

- Sends `window.sendMessageToCoreWebContents("webauthn:conditional-hide-overlay")`.

#### d) New handler: `webauthn:conditional-select` (from browser chrome)

- Finds the pending session for the active tab in the `BrowserWindow`.
- Constructs `allowedCredentials` with only the selected credential ID.
- Calls `webauthn.getCredential(publicKeyOptions, additionalOptions)` with the
  original challenge, rpId, etc. plus `allowedCredentials`.
- On success: resolves the stored pending Promise with the credential result.
- On failure: resolves with the error code.
- Cleans up the session.

#### e) New handler: `webauthn:conditional-dismiss` (from browser chrome)

- Resolves the pending Promise with `"NotAllowedError"`.
- Cleans up the session.

#### f) New handler: `webauthn:is-conditional-available`

- Returns `true` only if the addon is available (macOS only; the 13.3+ check is
  handled at runtime by `listPasskeys()` returning an error).

#### g) Cleanup

- When a tab's webContents emits `destroyed` or `did-start-navigation`:
  cancel any pending conditional session (resolve with `"AbortError"`,
  hide overlay).
- When a `BrowserWindow` is closed: cancel all sessions for tabs in that window.

---

### 3. Preload — Tab Side (`src/preload/index.ts`)

#### Modify `patchedCredentialsContainer`

Add new methods:

```typescript
reportInputFocus: (rect: { x: number; y: number; width: number; height: number }) =>
  ipcRenderer.send("webauthn:conditional-input-focus", rect),

reportInputBlur: () =>
  ipcRenderer.send("webauthn:conditional-input-blur"),

onConditionalPasskeys: (callback: (passkeys: PasskeyCredentialInfo[]) => void) => {
  const wrapped = (_event: any, passkeys: PasskeyCredentialInfo[]) => callback(passkeys);
  ipcRenderer.on("webauthn:conditional-passkeys", wrapped);
  return () => ipcRenderer.removeListener("webauthn:conditional-passkeys", wrapped);
},

isConditionalAvailable: async () => {
  return ipcRenderer.invoke("webauthn:is-conditional-available");
},
```

#### Modify `isConditionalMediationAvailable`

Change from `return false` to call the new `isConditionalAvailable` IPC.

#### Modify main world script (`tinyPasskeysScript`)

In the `credentials.get` override, replace the `mediation === "conditional"`
throw with:

```javascript
if (options.mediation === "conditional") {
  let cleanupObservers = null;

  // Listen for passkey list from main process
  const cleanupListener = patchedCredentials.onConditionalPasskeys((passkeys) => {
    if (passkeys.length === 0) return;
    cleanupObservers = setupConditionalUI(patchedCredentials);
  });

  // Start long-lived get (resolves when user selects)
  const resultPromise = patchedCredentials.get(options);

  // Wire AbortSignal
  if (options.signal) {
    options.signal.addEventListener(
      "abort",
      () => {
        cleanupObservers?.();
        cleanupListener();
        patchedCredentials.reportInputBlur();
      },
      { once: true }
    );
  }

  const result = await resultPromise;
  cleanupObservers?.();
  cleanupListener();

  // ... handle result/error codes (same pattern as non-conditional) ...
  return result;
}
```

#### New function: `setupConditionalUI(patchedCredentials)`

Defined inside `tinyPasskeysScript` (runs in the page's main world):

1. Query all `<input>` elements whose `autocomplete` attribute includes `"webauthn"`.
2. Create a `MutationObserver` on `document.body` (`childList: true, subtree: true`)
   to detect dynamically added inputs.
3. For each matching input, attach:
   - **`focus`** listener: calls
     `patchedCredentials.reportInputFocus(input.getBoundingClientRect().toJSON())`
   - **`blur`** listener: calls `patchedCredentials.reportInputBlur()`
4. Attach a **`scroll`** listener on `window` (`passive: true, capture: true`)
   that calls `patchedCredentials.reportInputBlur()` — closes overlay on scroll.
5. Return a cleanup function that removes all observers and listeners.

---

### 4. Preload — Browser Chrome Side (`src/preload/index.ts`)

Add `passkeyOverlayAPI` to the flow API object, scoped to `"browser"` permission:

```typescript
const passkeyOverlayAPI: FlowPasskeyOverlayAPI = {
  onShow: (callback) => listenOnIPCChannel("webauthn:conditional-show-overlay", callback),
  onHide: (callback) => listenOnIPCChannel("webauthn:conditional-hide-overlay", callback),
  select: (credentialId) => ipcRenderer.send("webauthn:conditional-select", credentialId),
  dismiss: () => ipcRenderer.send("webauthn:conditional-dismiss")
};
```

Expose as `flow.passkeyOverlay` via `wrapAPI(passkeyOverlayAPI, "browser")`.

---

### 5. Renderer Component (`src/renderer/src/components/browser-ui/passkey-overlay.tsx`)

Three-component structure mirroring find-in-page:

#### `PasskeyItem` (presentation)

Single passkey row showing:

- Key/passkey icon
- `userName` (primary text)
- `rpId` (secondary, dimmed text)
- Hover highlight, click → `onSelect(id)`

#### `PasskeyDropdown` (presentation)

The dropdown panel:

- `motion.div` with slide-down entrance/exit animation.
- Styled: `bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-lg`.
- "Sign in with a passkey" header text.
- Lists `PasskeyItem` components.
- Keyboard: arrow keys navigate, Enter selects, Escape dismisses.
- Auto-focuses for keyboard navigation.

#### `PasskeyOverlay` (orchestrator, exported)

Mounted in `main.tsx` alongside `<FindInPage />`:

- State: `visible`, `passkeys[]`, `position`.
- Listens to `flow.passkeyOverlay.onShow(...)` — sets state, shows.
- Listens to `flow.passkeyOverlay.onHide(...)` — hides.
- Renders `PortalComponent` at the received position:
  ```tsx
  <PortalComponent
    visible={visible}
    autoFocus={true}
    zIndex={ViewLayer.OVERLAY}
    className="fixed"
    style={{ top: position.y, left: position.x, width, height }}
  >
    <PasskeyDropdown ... />
  </PortalComponent>
  ```
- `handleSelect(id)` → `flow.passkeyOverlay.select(id)`, hide.
- `handleDismiss()` → `flow.passkeyOverlay.dismiss()`, hide.

#### Mount in `main.tsx`

Add `<PasskeyOverlay />` at line 279 alongside `<FindInPage />`.

---

## Files Summary

| File                                                         | Action | Description                                                                  |
| ------------------------------------------------------------ | ------ | ---------------------------------------------------------------------------- |
| `src/shared/flow/interfaces/browser/passkey-overlay.ts`      | Create | Shared types for passkey overlay API                                         |
| `src/shared/flow/flow.ts`                                    | Modify | Add `passkeyOverlay` to `flow` type                                          |
| `src/main/ipc/webauthn/index.ts`                             | Modify | Conditional mediation logic, new IPC handlers, session management            |
| `src/main/ipc/webauthn/module.ts`                            | Modify | Add `isConditionalAvailable` check                                           |
| `src/preload/index.ts`                                       | Modify | Tab-side conditional methods, DOM observers, chrome-side `passkeyOverlayAPI` |
| `src/renderer/src/components/browser-ui/passkey-overlay.tsx` | Create | PasskeyOverlay dropdown component                                            |
| `src/renderer/src/components/browser-ui/main.tsx`            | Modify | Mount `<PasskeyOverlay />`                                                   |

---

## Edge Cases

| Scenario               | Handling                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------- |
| No passkeys for site   | `listPasskeys()` returns empty → resolve with `"NotAllowedError"`, no DOM observers    |
| macOS < 13.3           | `listPasskeys()` returns error → same as no passkeys                                   |
| Non-macOS              | `isConditionalMediationAvailable()` returns `false`; websites use non-conditional flow |
| Tab navigation / close | Pending session cancelled, overlay hidden, promise resolved with `"AbortError"`        |
| AbortSignal            | Wired through to cancel pending session and clean up DOM observers                     |
| Scroll                 | Overlay dismissed (matches Chrome behavior)                                            |
| Input re-focus         | Overlay reappears with cached passkey list (no re-query)                               |
| Multiple tabs          | Sessions keyed by tab `webContents.id`, fully independent                              |
| Portal blur            | Brief debounce before hiding to allow click registration (matches omnibox pattern)     |

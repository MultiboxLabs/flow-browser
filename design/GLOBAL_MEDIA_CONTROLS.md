# Global Media Controls

## Overview

Add browser-level media controls to the sidebar UI so users can see what's playing, play/pause, skip tracks, and mute tabs without switching to them.

## Current State (What Already Exists)

### Media State Tracking

The `Tab` class (`src/main/controllers/tabs-controller/tab.ts:160-161`) already tracks two media-related properties:

- `audible: boolean` -- whether the tab is currently producing audio (from `webContents.isCurrentlyAudible()`)
- `muted: boolean` -- whether the tab's audio is muted (from `webContents.isAudioMuted()`)

These are updated via coalesced `audio-state-changed`, `media-started-playing`, and `media-paused` WebContents events (`tab.ts:461-472`).

### Mute/Unmute

Full round-trip is implemented:

- **Main**: `tabs:set-tab-muted` IPC handler (`src/main/ipc/browser/tabs.ts:302-311`) calls `webContents.setAudioMuted()`
- **Preload**: `flow.tabs.setTabMuted(tabId, muted)` (`src/preload/index.ts:467-468`)
- **Renderer**: Per-tab audio indicator with animated Volume2/VolumeX icons in the sidebar (`src/renderer/src/components/browser-ui/browser-sidebar/_components/tab-group.tsx:127-145`)

### IPC Update Channel

Tab content changes (title, url, audible, muted, isLoading, etc.) are debounced at 80ms and sent via `tabs:on-tabs-content-updated` as lightweight per-tab patches (`src/main/ipc/browser/tabs.ts:192-209`). This means the renderer already receives near-real-time `audible`/`muted` state for all tabs.

### Picture-in-Picture

Auto-PiP for tabs with playing video when they become hidden (`src/main/controllers/tabs-controller/tab-lifecycle.ts:245-291`). Uses `webContents.executeJavaScript()` to interact with page media elements.

### What's Missing

1. No MediaSession metadata forwarding (track title, artist, album art)
2. No media playback controls (play/pause/skip without switching tabs)
3. No global "now playing" UI beyond per-tab speaker icons
4. No hardware media key support
5. No mute/unmute in tab context menu

---

## Architecture

### Data Flow

```
Web Page (navigator.mediaSession)
  --> Content Script (injected JS)
    --> Tab class (main process) -- stores media metadata + playback state
      --> IPC content update channel (80ms debounce, existing)
        --> TabsProvider (renderer) -- existing tab data includes new fields
          --> GlobalMediaControls component (renderer) -- derives "now playing" from tab data
```

### Design Principles

1. **Piggyback on existing infrastructure** -- Media metadata is added to the `Tab` class and flows through the same debounced IPC update channel already used for title/url/audible/muted. No new IPC channels for state.
2. **Controls via `executeJavaScript`** -- Play/pause/skip are executed on the tab's webContents via JS injection, same pattern as PiP. No new content script IPC needed for actions.
3. **Renderer derives, doesn't own** -- The renderer derives "which tab is the primary media tab" from existing `TabsProvider` data. No separate media state store.
4. **Progressive enhancement** -- Phase 1 works with just `audible`/`muted` + tab title (no MediaSession). Phase 2 adds rich metadata.

---

## Phase 1: Basic Media Controls (audible/muted only)

Uses only the data already available in `TabData` (`audible`, `muted`, `title`, `faviconURL`). No main process changes needed for state -- only for playback control actions.

### 1.1 Add Media Control IPC Handlers

**File: `src/main/ipc/browser/tabs.ts`**

Add handlers that execute JS on a tab's webContents to control playback:

```typescript
ipcMain.handle("tabs:media-play-pause", async (_event, tabId: number) => {
  const tab = tabsController.getTabById(tabId);
  if (!tab?.webContents) return false;

  // Try MediaSession first, fall back to finding media elements
  const script = `
    (function() {
      // Try toggling via media elements directly
      const media = document.querySelector('video, audio');
      if (media) {
        if (media.paused) { media.play(); } else { media.pause(); }
        return true;
      }
      return false;
    })()
  `;
  try {
    return await tab.webContents.executeJavaScript(script, true);
  } catch { return false; }
});

ipcMain.handle("tabs:media-next-track", async (_event, tabId: number) => { ... });
ipcMain.handle("tabs:media-previous-track", async (_event, tabId: number) => { ... });
```

### 1.2 Extend Shared Types

**File: `src/shared/flow/interfaces/browser/tabs.ts`**

Add to `FlowTabsAPI`:

```typescript
mediaPlayPause: (tabId: number) => Promise<boolean>;
mediaNextTrack: (tabId: number) => Promise<boolean>;
mediaPreviousTrack: (tabId: number) => Promise<boolean>;
```

### 1.3 Extend Preload Bridge

**File: `src/preload/index.ts`**

Add to the `tabsAPI` object:

```typescript
mediaPlayPause: async (tabId: number) => ipcRenderer.invoke("tabs:media-play-pause", tabId),
mediaNextTrack: async (tabId: number) => ipcRenderer.invoke("tabs:media-next-track", tabId),
mediaPreviousTrack: async (tabId: number) => ipcRenderer.invoke("tabs:media-previous-track", tabId),
```

### 1.4 Add Mute/Unmute to Tab Context Menu

**File: `src/main/ipc/browser/tabs.ts`** (in `tabs:show-context-menu` handler)

Add a menu item after the separator, before "Close Tab":

```typescript
contextMenu.append(
  new MenuItem({
    label: tab.muted ? "Unmute Tab" : "Mute Tab",
    click: () => {
      tab.webContents?.setAudioMuted(!tab.muted);
      tab.updateTabState();
    }
  })
);
```

### 1.5 GlobalMediaControls Renderer Component

**File: `src/renderer/src/components/browser-ui/browser-sidebar/_components/global-media-controls.tsx`**

A compact bar in the sidebar that appears when any tab is playing audio.

```
+------------------------------------------+
|  [favicon] Tab Title           [>] [x]   |
+------------------------------------------+
```

- **Derives media tabs** from `TabsProvider`: filters all tabs where `audible === true || muted === true` (muted tabs were playing before mute)
- **Primary media tab**: the first audible tab, or if none are audible, the first muted tab
- **Shows**: favicon, tab title (truncated), play/pause toggle, mute toggle
- **Click on title/favicon**: switches to that tab via `flow.tabs.switchToTab()`
- **AnimatePresence** for show/hide (consistent with existing patterns in the codebase)

**Placement in `src/renderer/src/components/browser-ui/browser-sidebar/inner.tsx`**:

Between `<UpdateBanner />` and the bottom settings row (line 67-69):

```tsx
{/* Update Banner */}
<UpdateBanner />
{/* Global Media Controls */}
<GlobalMediaControls />
{/* Bottom Section */}
<div className="shrink-0 flex items-center ...">
```

---

## Phase 2: MediaSession Metadata

Adds rich metadata from `navigator.mediaSession` (track title, artist, album art).

### 2.1 Extend Tab Class with Media Metadata

**File: `src/main/controllers/tabs-controller/tab.ts`**

Add new content properties:

```typescript
// Media metadata (from page's navigator.mediaSession)
public mediaTitle: string | null = null;
public mediaArtist: string | null = null;
public mediaArtwork: string | null = null;
public mediaPlaybackState: "playing" | "paused" | "none" = "none";
```

Add `"mediaTitle" | "mediaArtist" | "mediaArtwork" | "mediaPlaybackState"` to `TabContentProperty`.

### 2.2 Inject MediaSession Observer

**File: `src/main/controllers/tabs-controller/tab.ts`** (in `setupWebContentsListeners`)

After the page loads, inject a script that polls `navigator.mediaSession` and sends metadata back:

```typescript
webContents.on("did-finish-load", () => {
  webContents.executeJavaScript(`
    (function() {
      if (window.__flowMediaObserver) return;
      window.__flowMediaObserver = true;

      const send = () => {
        const ms = navigator.mediaSession;
        if (!ms || !ms.metadata) return;
        // Post to main process via a custom DOM event that the
        // preload script listens for, or use a polling approach
        // that the main process reads via executeJavaScript.
      };

      // Poll every 2 seconds (MediaSession has no change event)
      setInterval(send, 2000);
    })()
  `);
});
```

**Alternative (preferred)**: Instead of polling from injected JS, poll from the main process on tabs that are `audible === true`. This avoids injecting persistent scripts into web pages:

```typescript
// In TabsController or a new MediaMetadataManager
// When a tab becomes audible, start polling its metadata every 2s
// When it stops being audible, stop polling
const script = `
  (function() {
    const ms = navigator.mediaSession;
    if (!ms?.metadata) return null;
    return {
      title: ms.metadata.title || null,
      artist: ms.metadata.artist || null,
      artwork: (ms.metadata.artwork?.[0]?.src) || null,
      playbackState: ms.playbackState || "none"
    };
  })()
`;
```

### 2.3 Extend `TabData` Shared Type

**File: `src/shared/types/tabs.ts`**

Add to `TabData`:

```typescript
export type TabData = Omit<PersistedTabData, "navHistory" | "navHistoryIndex"> & {
  // ... existing fields ...
  mediaTitle: string | null;
  mediaArtist: string | null;
  mediaArtwork: string | null;
  mediaPlaybackState: "playing" | "paused" | "none";
};
```

These are runtime-only (NOT added to `PersistedTabData`).

### 2.4 Enhance GlobalMediaControls UI

Update the component to display rich metadata when available:

```
+------------------------------------------+
|  [artwork]  Track Title                  |
|             Artist Name     [<<][>][>>]  |
+------------------------------------------+
```

- Falls back to favicon + tab title when MediaSession metadata is unavailable
- Show next/prev buttons only when the page's MediaSession declares those action handlers (this can be detected by attempting the action and checking the result, or by querying `navigator.mediaSession` capabilities)

---

## Phase 3: Hardware Media Keys

### 3.1 Register Global Shortcuts

**File: `src/main/modules/shortcuts.ts`** (or new file `src/main/modules/media-keys.ts`)

```typescript
import { globalShortcut } from "electron";

export function registerMediaKeys(getMediaTab: () => Tab | null) {
  globalShortcut.register("MediaPlayPause", () => {
    const tab = getMediaTab();
    if (tab?.webContents) {
      tab.webContents.executeJavaScript(`...play/pause script...`);
    }
  });

  globalShortcut.register("MediaNextTrack", () => { ... });
  globalShortcut.register("MediaPreviousTrack", () => { ... });
  globalShortcut.register("MediaStop", () => { ... });
}
```

### 3.2 Primary Media Tab Resolution

**File: `src/main/controllers/tabs-controller/index.ts`**

Add a method to determine the "primary" media tab:

```typescript
getPrimaryMediaTab(): Tab | null {
  // Return the most recently active audible tab
  let bestTab: Tab | null = null;
  for (const tab of this.tabs.values()) {
    if (!tab.audible || tab.isDestroyed) continue;
    if (!bestTab || tab.lastActiveAt > bestTab.lastActiveAt) {
      bestTab = tab;
    }
  }
  return bestTab;
}
```

### 3.3 Lifecycle

- Register keys on `app.whenReady()`
- Unregister on `app.on("will-quit")`
- Keys are global (work even when the browser is not focused)

---

## Phase 4: Polish & Edge Cases

### Multiple Media Tabs

When multiple tabs are producing audio simultaneously:

- The global controls target the **most recently activated** audible tab
- A small indicator (e.g., badge count or dropdown) shows how many tabs are playing
- Clicking the indicator expands a list of all media tabs with individual controls

### Sleeping Tabs

Sleeping tabs have no webContents and cannot play audio. They are excluded from media tab lists. If a media tab is put to sleep, the global controls should update to show the next active media tab or hide entirely.

### Cross-Window

The current IPC model sends tab data per-window. Each window's sidebar shows media controls for tabs in that window only. This is consistent with how the tab list works -- each window has its own sidebar showing its own tabs.

### Performance

- MediaSession metadata polling (Phase 2) only runs on audible tabs, throttled to every 2 seconds
- Media state changes piggyback on the existing 80ms debounced content update channel -- no additional IPC
- The renderer `GlobalMediaControls` component only re-renders when media-related tab fields change (it reads from `TabsProvider` which already does reference-equality optimizations)

### Animation

- The media controls bar uses `AnimatePresence` + `motion.div` with spring transitions, matching the existing audio indicator pattern in `tab-group.tsx`
- Slides in from bottom or fades in when a media tab starts playing
- Slides/fades out when no tabs are playing

---

## Implementation Order

| Step | Phase   | Effort | Status    | Description                                                        |
| ---- | ------- | ------ | --------- | ------------------------------------------------------------------ |
| 1    | 1.4     | Small  | DONE      | Add mute/unmute to tab context menu                                |
| 2    | 1.1     | Medium | DONE      | Add media play/pause/skip IPC handlers (executeJavaScript)         |
| 3    | 1.2-1.3 | Small  | DONE      | Extend FlowTabsAPI interface + preload bridge                      |
| 4    | 1.5     | Medium | DONE      | Build GlobalMediaControls sidebar component (title + favicon only) |
| 5    | 2.1-2.2 | Large  | DONE      | Add MediaSession metadata extraction via preload push approach     |
| 6    | 2.3-2.4 | Medium | DONE      | Extend TabData + enhance UI with track/artist/artwork              |
| 7    | 3.1-3.3 | Small  | CANCELLED | Hardware media keys (handled natively by Chromium/system)          |
| 8    | 4       | Small  | DONE      | Multi-tab cards, active tab filtering, animations                  |

### Implementation Notes

**Preload-based push approach (Phase 2)**: Instead of polling via `executeJavaScript`, we use `contextBridge.executeInMainWorld()` to inject a MutationObserver + play/pause event listeners that push metadata changes via IPC. This is more efficient and avoids the complexity of managing polling intervals from the main process.

**Action handler monkey-patching**: The preload also monkey-patches `navigator.mediaSession.setActionHandler()` to capture handler references in `window.__flowMediaActionHandlers`. This allows skip track and play/pause controls to call the page's actual MediaSession handlers directly, rather than dispatching fake keyboard events which don't trigger MediaSession handlers.

**Background tab compatibility**: Uses `setTimeout` (not `requestAnimationFrame`) for debouncing because Chromium completely suspends rAF in background tabs. Play/pause events are sent immediately (not debounced) for instant UI response.

**Playback state derivation**: Always derives playback state from the actual `<video>`/`<audio>` element's `.paused` property as ground truth, falling back to `navigator.mediaSession.playbackState` only when no media element exists. Many sites set playbackState to "playing" but never update it to "paused".

**TODO**: Support media controls in iframes (e.g. YouTube embeds). Currently only watches the main frame to avoid duplicate/conflicting messages.

---

## Key Files

| File                                                                                           | Role                                                       |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `src/main/controllers/tabs-controller/tab.ts`                                                  | Tab class -- media state properties, WebContents listeners |
| `src/main/controllers/tabs-controller/index.ts`                                                | TabsController -- primary media tab resolution             |
| `src/main/ipc/browser/tabs.ts`                                                                 | IPC handlers -- media control actions, context menu        |
| `src/shared/types/tabs.ts`                                                                     | TabData type -- media metadata fields                      |
| `src/shared/flow/interfaces/browser/tabs.ts`                                                   | FlowTabsAPI -- media control methods                       |
| `src/preload/index.ts`                                                                         | Preload bridge -- media control methods                    |
| `src/renderer/src/components/browser-ui/browser-sidebar/_components/global-media-controls.tsx` | Global media controls UI component                         |
| `src/renderer/src/components/browser-ui/browser-sidebar/inner.tsx`                             | Sidebar layout -- placement of media controls              |
| `src/main/modules/media-keys.ts`                                                               | Hardware media key registration (Phase 3)                  |

/**
 * Cursor Edge Monitor
 *
 * Polls `screen.getCursorScreenPoint()` in the main process and fires
 * "interface:cursor-at-edge" IPC events to focused browser windows with
 * the current cursor position and edge state.
 *
 * This is needed because tab WebContentsViews sit above the chrome renderer
 * and consume all mouse events, preventing the renderer's document.mousemove
 * from detecting the cursor near the window edge.
 *
 * Events are sent on every poll tick while the cursor is inside the window
 * (plus one final event when it exits) so the renderer has continuous
 * position data for both edge-enter detection and distance-based detach.
 */

import { screen } from "electron";
import { windowsController } from "@/controllers/windows-controller";
import { BrowserWindow } from "@/controllers/windows-controller/types/browser";
import type { CursorEdgeEvent } from "~/flow/interfaces/browser/interface";

const POLL_MS = 1000 / 30; // ~30 fps
const EDGE_THRESHOLD = 10; // px from edge to trigger

/** Track whether the cursor was inside the window on the last tick. */
const cursorInsideWindow = new Map<number, boolean>();

let pollTimer: ReturnType<typeof setInterval> | null = null;
let activeWindowCount = 0;

function getEdge(localX: number, windowWidth: number): "left" | "right" | null {
  if (localX < EDGE_THRESHOLD) return "left";
  if (localX > windowWidth - EDGE_THRESHOLD) return "right";
  return null;
}

function poll() {
  const focused = windowsController.getFocused();
  if (!focused || !(focused instanceof BrowserWindow)) return;

  const win = focused.browserWindow;
  if (win.isDestroyed() || win.isMinimized()) return;

  const cursor = screen.getCursorScreenPoint();
  const bounds = win.getBounds();

  // Convert screen coords to window-local coords
  const localX = cursor.x - bounds.x;
  const localY = cursor.y - bounds.y;

  const isInside = localX >= 0 && localX <= bounds.width && localY >= 0 && localY <= bounds.height;
  const wasInside = cursorInsideWindow.get(focused.id) ?? false;

  if (isInside) {
    // Cursor is inside the window — send position every tick
    cursorInsideWindow.set(focused.id, true);
    const edge = getEdge(localX, bounds.width);
    sendEvent(focused, { edge, x: localX });
  } else if (wasInside) {
    // Cursor just left the window — send one final "exited" event
    cursorInsideWindow.set(focused.id, false);
    sendEvent(focused, { edge: null, x: localX });
  }
}

function sendEvent(win: BrowserWindow, event: CursorEdgeEvent) {
  win.sendMessageToCoreWebContents("interface:cursor-at-edge", event);
}

function startPolling() {
  if (pollTimer != null) return;
  pollTimer = setInterval(poll, POLL_MS);
}

function stopPolling() {
  if (pollTimer != null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  cursorInsideWindow.clear();
}

/** Call once at app startup to wire up the monitor. */
export function initCursorEdgeMonitor() {
  // Track browser window add/remove to start/stop polling
  windowsController.on("window-added", (_id, window) => {
    if (window instanceof BrowserWindow) {
      activeWindowCount++;
      if (activeWindowCount === 1) startPolling();
    }
  });

  windowsController.on("window-removed", (_id, window) => {
    if (window instanceof BrowserWindow) {
      activeWindowCount--;
      cursorInsideWindow.delete(window.id);
      if (activeWindowCount <= 0) {
        activeWindowCount = 0;
        stopPolling();
      }
    }
  });
}

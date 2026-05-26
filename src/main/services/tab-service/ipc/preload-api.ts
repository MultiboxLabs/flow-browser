/**
 * Preload API factory for the Tab Service.
 *
 * This file provides a function that creates the `FlowTabServiceAPI`
 * implementation for use in the preload script. It maps IPC channels
 * to the API surface defined in shared/flow/interfaces/browser/tab-service.ts.
 *
 * Usage in preload/index.ts:
 *   import { createTabServicePreloadAPI } from "@/services/tab-service/ipc/preload-api";
 *   const tabServiceAPI = createTabServicePreloadAPI(ipcRenderer, listenOnIPCChannel);
 */

import type { IpcRenderer } from "electron";
import type { FlowTabServiceAPI } from "~/flow/interfaces/browser/tab-service";
import type {
  TabData,
  WindowTabsPayload,
  PinnedTabData,
  TabPlaceholderUpdate,
  TabTargetUrlUpdate
} from "~/types/tab-service";

type ListenFn = (channel: string, callback: (...args: unknown[]) => void) => () => void;

/**
 * Creates the preload API for the tab service.
 */
export function createTabServicePreloadAPI(ipcRenderer: IpcRenderer, listenOnIPCChannel: ListenFn): FlowTabServiceAPI {
  return {
    // --- Data Queries ---
    getData: () => ipcRenderer.invoke("tab-service:get-data"),

    onDataUpdated: (callback: (data: WindowTabsPayload) => void) => {
      return listenOnIPCChannel("tab-service:on-data-changed", callback as (...args: unknown[]) => void);
    },

    onContentUpdated: (callback: (tabs: TabData[]) => void) => {
      return listenOnIPCChannel("tab-service:on-content-updated", callback as (...args: unknown[]) => void);
    },

    onPlaceholderChanged: (callback: (update: TabPlaceholderUpdate) => void) => {
      return listenOnIPCChannel("tab-service:on-placeholder-changed", callback as (...args: unknown[]) => void);
    },

    onTargetUrlChanged: (callback: (update: TabTargetUrlUpdate) => void) => {
      return listenOnIPCChannel("tab-service:on-target-url", callback as (...args: unknown[]) => void);
    },

    // --- Tab Operations ---
    switchToTab: (tabId: number) => ipcRenderer.invoke("tab-service:switch-to-tab", tabId),

    newTab: (url?: string, isForeground?: boolean, spaceId?: string, typedFromAddressBar?: boolean) =>
      ipcRenderer.invoke("tab-service:new-tab", url, isForeground, spaceId, typedFromAddressBar),

    closeTab: (tabId: number) => ipcRenderer.invoke("tab-service:close-tab", tabId),

    setTabMuted: (tabId: number, muted: boolean) => ipcRenderer.invoke("tab-service:set-tab-muted", tabId, muted),

    moveTab: (tabId: number, newPosition: number) => ipcRenderer.invoke("tab-service:move-tab", tabId, newPosition),

    moveTabToSpace: (tabId: number, spaceId: string, newPosition?: number) =>
      ipcRenderer.invoke("tab-service:move-tab-to-space", tabId, spaceId, newPosition),

    batchMoveTabs: (tabIds: number[], spaceId: string, newPositionStart?: number) =>
      ipcRenderer.invoke("tab-service:batch-move-tabs", tabIds, spaceId, newPositionStart),

    showContextMenu: (tabId: number) => ipcRenderer.send("tab-service:show-context-menu", tabId),

    disablePictureInPicture: (goBackToTab: boolean) => ipcRenderer.invoke("tab-service:disable-pip", goBackToTab),

    // --- Recently Closed ---
    getRecentlyClosed: () => ipcRenderer.invoke("tab-service:get-recently-closed"),

    restoreRecentlyClosed: (uniqueId: string) => ipcRenderer.invoke("tab-service:restore-recently-closed", uniqueId),

    clearRecentlyClosed: () => ipcRenderer.invoke("tab-service:clear-recently-closed"),

    // --- Layout Node Operations ---
    createLayoutNode: (mode: "glance" | "split", tabIds: number[]) =>
      ipcRenderer.invoke("tab-service:create-layout-node", mode, tabIds),

    dissolveLayoutNode: (nodeId: string) => ipcRenderer.invoke("tab-service:dissolve-layout-node", nodeId),

    // --- Pinned Tabs ---
    getPinnedTabs: () => ipcRenderer.invoke("tab-service:pinned-tabs-get-data"),

    onPinnedTabsChanged: (callback: (data: Record<string, PinnedTabData[]>) => void) => {
      return listenOnIPCChannel("tab-service:pinned-tabs-changed", callback as (...args: unknown[]) => void);
    },

    createPinnedTabFromTab: (tabId: number, position?: number) =>
      ipcRenderer.invoke("tab-service:pinned-tabs-create-from-tab", tabId, position),

    clickPinnedTab: (pinnedTabId: string) => ipcRenderer.invoke("tab-service:pinned-tabs-click", pinnedTabId),

    doubleClickPinnedTab: (pinnedTabId: string) =>
      ipcRenderer.invoke("tab-service:pinned-tabs-double-click", pinnedTabId),

    removePinnedTab: (pinnedTabId: string) => ipcRenderer.invoke("tab-service:pinned-tabs-remove", pinnedTabId),

    unpinToTabList: (pinnedTabId: string, position?: number) =>
      ipcRenderer.invoke("tab-service:pinned-tabs-unpin", pinnedTabId, position),

    reorderPinnedTab: (pinnedTabId: string, newPosition: number) =>
      ipcRenderer.invoke("tab-service:pinned-tabs-reorder", pinnedTabId, newPosition),

    showPinnedTabContextMenu: (pinnedTabId: string) =>
      ipcRenderer.send("tab-service:show-pinned-tab-context-menu", pinnedTabId)
  };
}

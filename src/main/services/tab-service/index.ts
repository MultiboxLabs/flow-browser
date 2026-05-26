/**
 * Tab Service v2 — Entry Point
 *
 * This module exports the singleton TabService instance and related
 * components. It is the new architecture for tab management in Flow Browser.
 *
 * Architecture Overview:
 * - TabService: Central orchestrator managing all tabs, layouts, and pinned tabs
 * - Tab: Core entity with identity, state, WebContentsView, and events
 * - TabLayoutNode: Represents tabs displayed together (single, glance, split)
 * - TabLayout: Per-window layout state (active node, focused tab, history)
 * - TabPositioner: Manages tab ordering within spaces
 * - PinnedTab: Persistent URL shortcut with per-space associations
 * - TabPersistenceService: Handles saving/restoring to database
 * - TabIPC: Handles all renderer communication
 *
 * Key differences from old Tab Manager:
 * - OOP design with clear ownership
 * - "TabGroup" in old system -> "TabLayoutNode" (display grouping)
 * - True "TabGroup" reserved for folder-like organization (future)
 * - Pinned tabs are a core component with direct Tab ownership
 * - Future-proofed for bookmarks via TabOwnerRef
 * - Clean IPC layer with debounced updates
 * - Separate persistence service
 */

import { TabService } from "./tab-service";
import { TabPersistenceService } from "./persistence/tab-persistence-service";
import { TabIPC } from "./ipc/tab-ipc";
import { initTabSync } from "./tab-sync";

// Export classes
export { TabService } from "./tab-service";
export { Tab } from "./core/tab";
export { TabLayoutNode } from "./core/tab-layout-node";
export { PinnedTab } from "./core/pinned-tab";
export { TabLayout } from "./layout/tab-layout";
export { TabPositioner } from "./layout/tab-positioner";
export { TabPersistenceService } from "./persistence/tab-persistence-service";
export { TabIPC } from "./ipc/tab-ipc";

// Singleton instance
export const tabService = new TabService();
export const tabPersistenceService = new TabPersistenceService(tabService);
export const tabIPC = new TabIPC(tabService);

/**
 * Initialize the tab service and all its sub-systems.
 * Should be called during app startup after the database is ready.
 */
let tabServiceInitialized = false;

export function initializeTabService(): void {
  if (tabServiceInitialized) return;
  tabServiceInitialized = true;

  tabService.loadPinnedTabs();
  tabService.startBackgroundTasks();
  tabPersistenceService.start();
  tabIPC.initialize();
  initTabSync();
}

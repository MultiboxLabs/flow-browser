import { IPCListener } from "~/flow/types";
import { ShortcutAction } from "~/types/shortcuts";

export type ShortcutsData = ShortcutAction[];

// API //
export interface FlowShortcutsAPI {
  /**
   * Get all shortcuts
   */
  getShortcuts: () => Promise<ShortcutsData>;

  /**
   * Set a shortcut
   */
  setShortcut: (actionId: string, shortcut: string) => Promise<boolean>;

  /**
   * Reset a shortcut
   */
  resetShortcut: (actionId: string) => Promise<boolean>;

  /**
   * Listen for shortcuts updates
   */
  onShortcutsUpdated: IPCListener<[ShortcutsData]>;
}

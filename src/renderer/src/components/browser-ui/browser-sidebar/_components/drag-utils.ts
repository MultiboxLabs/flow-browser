import type { PinnedTabSourceData } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import type { TabGroupSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-group";

export function isPinnedTabSource(data: Record<string, unknown>): data is PinnedTabSourceData {
  return data.type === "pinned-tab" && typeof data.pinnedTabId === "string";
}

export function isTabGroupSource(data: Record<string, unknown>): data is TabGroupSourceData {
  return data.type === "tab-group" && typeof data.primaryTabId === "number";
}

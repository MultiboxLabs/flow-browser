import type { PinnedTabSourceData } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/pinned-tab-button";
import type { TabLayoutNodeSourceData } from "@/components/browser-ui/browser-sidebar/_components/tab-layout-node";

export function isPinnedTabSource(data: Record<string, unknown>): data is PinnedTabSourceData {
  return data.type === "pinned-tab" && typeof data.pinnedTabId === "string" && typeof data.profileId === "string";
}

export function isTabLayoutNodeSource(data: Record<string, unknown>): data is TabLayoutNodeSourceData {
  return data.type === "tab-layout-node" && typeof data.primaryTabId === "number";
}

import { IPCListener } from "~/flow/types";

export interface FindInPageResult {
  requestId: number;
  activeMatchOrdinal: number;
  matches: number;
}

export interface FlowFindInPageAPI {
  find: (text: string, options?: { forward?: boolean; findNext?: boolean }) => Promise<FindInPageResult | null>;
  stop: (action: "clearSelection" | "keepSelection" | "activateSelection") => void;
  onToggle: IPCListener<[void]>;
}

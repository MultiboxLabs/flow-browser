import { IPCListener } from "~/flow/types";

export interface FindInPageResult {
  activeMatchOrdinal: number;
  matches: number;
}

export interface FlowFindInPageAPI {
  find: (text: string, options?: { forward?: boolean; findNext?: boolean }) => void;
  stop: (action: "clearSelection" | "keepSelection" | "activateSelection") => void;
  onResult: IPCListener<[FindInPageResult]>;
  onToggle: IPCListener<[void]>;
}

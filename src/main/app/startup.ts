import { performance } from "node:perf_hooks";

// Use the Node process start time rather than module evaluation time.
export const appStartTimestamp = performance.timeOrigin;

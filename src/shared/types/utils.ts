/** `Omit<T, K>` on a union uses `keyof T` as key intersection; omit each member instead. */
export type DistributiveOmit<T, K extends keyof T> = T extends T ? Omit<T, K> : never;

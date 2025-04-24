export type PageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type IPCListener<T extends unknown[]> = (callback: (...data: T) => void) => () => void;

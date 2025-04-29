import { useState } from "react";

export function useForceUpdate() {
  const [, setState] = useState(0);
  return () => setState((state) => state + 1);
}

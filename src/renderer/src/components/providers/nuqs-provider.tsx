import { NuqsAdapter } from "nuqs/adapters/react";
import type { ReactNode } from "react";

export function NuqsProvider({ children }: { children: ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}

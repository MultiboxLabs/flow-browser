import { NuqsAdapter } from "nuqs/adapters/react";

export function NuqsProvider({ children }: { children: React.ReactNode }) {
  return <NuqsAdapter>{children}</NuqsAdapter>;
}

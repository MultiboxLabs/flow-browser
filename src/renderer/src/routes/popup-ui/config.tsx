import { ReactNode } from "react";

export const RouteConfig = {
  Providers: ({ children }: { children: ReactNode }) => {
    return children;
  },
  Fallback: null
};

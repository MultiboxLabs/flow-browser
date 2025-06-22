import { PortalsProvider } from "@/components/portal/provider";
import { RouteConfigType } from "@/types/routes";
import { ReactNode } from "react";

export const RouteConfig: RouteConfigType = {
  Providers: ({ children }: { children: ReactNode }) => {
    return <PortalsProvider>{children}</PortalsProvider>;
  },
  Fallback: null
};

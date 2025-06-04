import { FunctionComponent, ReactNode } from "react";

export interface RouteConfig {
  Providers: FunctionComponent;
  Fallback: ReactNode | null;
}

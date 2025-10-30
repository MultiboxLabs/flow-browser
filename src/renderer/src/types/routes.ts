import { FunctionComponent, ReactNode } from "react";

export interface RouteConfigType {
  Providers: FunctionComponent<{ children: ReactNode }>;
}

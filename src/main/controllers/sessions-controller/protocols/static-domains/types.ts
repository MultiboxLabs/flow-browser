import type { CustomProtocol } from "../types";

type SubdirectoryActualDomainInfo = {
  type: "subdirectory";
  subdirectory: string;
};
type RoutedActualDomainInfo = {
  type: "route";
  route: string;
};

type ActualDomainInfo = SubdirectoryActualDomainInfo | RoutedActualDomainInfo;

export type StaticDomainInfo = {
  protocol: CustomProtocol;
  hostname: string;
  actual: ActualDomainInfo;
};

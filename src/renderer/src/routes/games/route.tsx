import { RouteConfig } from "./config";
import PageComponent from "./page";

export default function Route() {
  return (
    <RouteConfig.Providers>
      <PageComponent />
    </RouteConfig.Providers>
  );
}

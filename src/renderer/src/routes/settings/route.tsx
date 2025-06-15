import { Suspense } from "react";
import { RouteConfig } from "./config";
import PageComponent from "./page";

export default function Route() {
  return (
    <RouteConfig.Providers>
      <Suspense fallback={RouteConfig.Fallback}>
        <PageComponent />
      </Suspense>
    </RouteConfig.Providers>
  );
}

import { lazy, Suspense } from "react";
import { RouteConfig } from "./config";

const PageComponent = lazy(() => import("./page"));

export default function Route() {
  return (
    <RouteConfig.Providers>
      <Suspense fallback={RouteConfig.Fallback}>
        <PageComponent />
      </Suspense>
    </RouteConfig.Providers>
  );
}

import { lazy, Suspense } from "react";
import { RouteProviders } from "./config";

const PageComponent = lazy(() => import("./page"));

export default function Route() {
  return (
    <RouteProviders>
      <Suspense>
        <PageComponent />
      </Suspense>
    </RouteProviders>
  );
}

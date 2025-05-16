import { RouterProvider } from "./router/provider";
import { Route } from "./router/route";
import { Toaster } from "sonner";
import { PlatformProvider } from "@/components/main/platform";
import { QueryParamProvider } from "use-query-params";
import { WindowHistoryAdapter } from "use-query-params/adapters/window";

// Protocols //
const flowProtocol = "flow:";
const flowInternalProtocol = "flow-internal:";

// Pages //
import MainUIRoute from "./routes/main-ui/route";
import PopupUIRoute from "./routes/popup-ui/route";
import NewTabRoute from "./routes/new-tab/route";
import SettingsRoute from "./routes/settings/route";
import ErrorRoute from "./routes/error/route";
import AboutRoute from "./routes/about/route";
import GamesRoute from "./routes/games/route";
import OmniboxRoute from "./routes/omnibox/route";
import OmniboxDebugRoute from "./routes/omnibox-debug/route";
import OnboardingRoute from "./routes/onboarding/route";
import ExtensionsRoute from "./routes/extensions/route";
import PDFViewerRoute from "./routes/pdf-viewer/route";

// Routes //
function Routes() {
  return (
    <RouterProvider>
      <Route protocol={flowInternalProtocol} hostname="main-ui">
        <MainUIRoute />
      </Route>
      <Route protocol={flowInternalProtocol} hostname="popup-ui">
        <PopupUIRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="new-tab">
        <NewTabRoute />
      </Route>
      <Route protocol={flowInternalProtocol} hostname="settings">
        <SettingsRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="error">
        <ErrorRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="about">
        <AboutRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="games">
        <GamesRoute />
      </Route>
      <Route protocol={flowInternalProtocol} hostname="omnibox">
        <OmniboxRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="omnibox">
        <OmniboxDebugRoute />
      </Route>
      <Route protocol={flowInternalProtocol} hostname="onboarding">
        <OnboardingRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="extensions">
        <ExtensionsRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="pdf-viewer">
        <PDFViewerRoute />
      </Route>
    </RouterProvider>
  );
}

function App() {
  return (
    <QueryParamProvider adapter={WindowHistoryAdapter}>
      <PlatformProvider>
        <Routes />
        <Toaster richColors />
      </PlatformProvider>
    </QueryParamProvider>
  );
}

export default App;

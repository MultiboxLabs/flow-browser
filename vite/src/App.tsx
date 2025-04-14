import { RouterProvider } from "./router/provider";
import { Route } from "./router/route";
import { Toaster } from "sonner";
import { PlatformProvider } from "@/components/main/platform";

// Protocols //
const flowProtocol = "flow:";
const flowInternalProtocol = "flow-internal:";

// Pages //
import MainRoute from "./routes/main/route";
import NewTabRoute from "./routes/new-tab/route";
import SettingsRoute from "./routes/settings/route";
import ErrorRoute from "./routes/error/route";
import GlanceModalRoute from "./routes/glance-modal/route";
import AboutRoute from "./routes/about/route";
import GamesRoute from "./routes/games/route";
import OmniboxRoute from "./routes/omnibox/route";
import OmniboxDebugRoute from "./routes/omnibox-debug/route";
import OnboardingRoute from "./routes/onboarding/route";

// Routes //
function Routes() {
  return (
    <RouterProvider>
      <Route hostname="main">
        <MainRoute />
      </Route>
      <Route hostname="new-tab">
        <NewTabRoute />
      </Route>
      <Route hostname="settings">
        <SettingsRoute />
      </Route>
      <Route hostname="error">
        <ErrorRoute />
      </Route>
      <Route hostname="glance-modal">
        <GlanceModalRoute />
      </Route>
      <Route hostname="about">
        <AboutRoute />
      </Route>
      <Route hostname="games">
        <GamesRoute />
      </Route>
      <Route protocol={flowInternalProtocol} hostname="omnibox">
        <OmniboxRoute />
      </Route>
      <Route protocol={flowProtocol} hostname="omnibox">
        <OmniboxDebugRoute />
      </Route>
      <Route hostname="onboarding">
        <OnboardingRoute />
      </Route>
    </RouterProvider>
  );
}

function App() {
  return (
    <PlatformProvider>
      <Routes />
      <Toaster richColors />
    </PlatformProvider>
  );
}

export default App;

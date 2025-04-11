import { RouterProvider } from "./router/provider";
import { Route } from "./router/route";

// Pages //
import MainPage from "./routes/main/page";
import NewTabPage from "./routes/new-tab/page";
import SettingsPage from "./routes/settings/page";
import ErrorPage from "./routes/error/page";
import GlanceModalPage from "./routes/glance-modal/page";
import FlowAboutPage from "./routes/flow-about/page";

// Routes //
const flowProtocol = "flow:";
function App() {
  return (
    <RouterProvider>
      <Route hostname="main">
        <MainPage />
      </Route>
      <Route hostname="new-tab">
        <NewTabPage />
      </Route>
      <Route hostname="settings">
        <SettingsPage />
      </Route>
      <Route hostname="error">
        <ErrorPage />
      </Route>
      <Route hostname="glance-modal">
        <GlanceModalPage />
      </Route>
      <Route protocol={flowProtocol} hostname="about">
        <FlowAboutPage />
      </Route>
    </RouterProvider>
  );
}

export default App;

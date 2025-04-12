import { RouterProvider } from "./router/provider";
import { Route } from "./router/route";
import { Toaster } from "sonner";

// Pages //
import MainPage from "./routes/main/page";
import NewTabPage from "./routes/new-tab/page";
import SettingsPage from "./routes/settings/page";
import ErrorPage from "./routes/error/page";
import GlanceModalPage from "./routes/glance-modal/page";
import AboutPage from "./routes/about/page";
import GamesPage from "./routes/games/page";
import { PlatformProvider } from "@/components/main/platform";

// Routes //
function Routes() {
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
      <Route hostname="about">
        <AboutPage />
      </Route>
      <Route hostname="games">
        <GamesPage />
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

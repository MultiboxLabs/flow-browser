import { ThemeProvider } from "@/components/main/theme";
import { SettingsLayout } from "@/components/settings/settings-layout";

function Page() {
  return <SettingsLayout />;
}

function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;

import { ThemeProvider } from "@/components/main/theme";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { useSettingsTranslations } from "@/lib/i18n";

function Page() {
  return <SettingsLayout />;
}

function App() {
  const { t: tSettings } = useSettingsTranslations();

  return (
    <ThemeProvider>
      <title>{tSettings("title")}</title>
      <Page />
    </ThemeProvider>
  );
}

export default App;

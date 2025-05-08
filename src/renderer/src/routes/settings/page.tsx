import { ThemeProvider } from "@/components/main/theme";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { useSettingsTranslations } from "@/lib/i18n";

function Page() {
  return <SettingsLayout />;
}

function App() {
  const { t } = useSettingsTranslations();

  return (
    <ThemeProvider>
      <title>{t("Flow Settings")}</title>
      <Page />
    </ThemeProvider>
  );
}

export default App;

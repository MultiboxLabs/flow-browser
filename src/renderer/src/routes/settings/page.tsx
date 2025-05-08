import { ThemeProvider } from "@/components/main/theme";
import { SettingsLayout } from "@/components/settings/settings-layout";
import { useTranslation } from "react-i18next";

function Page() {
  return <SettingsLayout />;
}

function App() {
  const { t } = useTranslation("settings");

  return (
    <ThemeProvider>
      <title>{t("Flow Settings")}</title>
      <Page />
    </ThemeProvider>
  );
}

export default App;

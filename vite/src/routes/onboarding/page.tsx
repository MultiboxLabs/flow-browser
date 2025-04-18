import { ThemeProvider } from "@/components/main/theme";
import { OnboardingMain } from "@/components/onboarding/main";
import { SettingsProvider } from "@/components/providers/settings-provider";

function Page() {
  return (
    <SettingsProvider>
      <OnboardingMain />
    </SettingsProvider>
  );
}

function App() {
  return (
    <ThemeProvider forceTheme="dark">
      <Page />
    </ThemeProvider>
  );
}
export default App;

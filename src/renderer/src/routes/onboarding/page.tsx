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
    <>
      <Page />
    </>
  );
}
export default App;

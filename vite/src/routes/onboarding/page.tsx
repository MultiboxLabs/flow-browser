import { ThemeProvider } from "@/components/main/theme";
import { OnboardingMain } from "@/components/onboarding/main";

function Page() {
  return <OnboardingMain />;
}

function App() {
  return (
    <ThemeProvider forceTheme="dark">
      <Page />
    </ThemeProvider>
  );
}
export default App;

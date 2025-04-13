import { ThemeProvider } from "@/components/main/theme";
import WelcomeScreen from "@/routes/onboarding/onboarding-screen";

function Page() {
  return <WelcomeScreen />;
}

function App() {
  return (
    <ThemeProvider forceTheme="dark">
      <Page />
    </ThemeProvider>
  );
}
export default App;

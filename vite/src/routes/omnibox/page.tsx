import { OmniboxMain } from "@/components/omnibox/main";
import { ThemeProvider } from "@/components/main/theme";

function Page() {
  return <OmniboxMain />;
}

function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;

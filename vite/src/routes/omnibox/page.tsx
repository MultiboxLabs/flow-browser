import { Omnibox } from "@/components/omnibox/main";
import { ThemeProvider } from "@/components/main/theme";

function Page() {
  return <Omnibox />;
}

function App() {
  return (
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

export default App;

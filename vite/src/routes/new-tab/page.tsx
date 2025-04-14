import { ThemeProvider } from "@/components/main/theme";
import { NewTabPage } from "@/components/new-tab/main";

function Page() {
  return <NewTabPage />;
}

function App() {
  return (
    <ThemeProvider persist>
      <title>New Tab</title>
      <Page />
    </ThemeProvider>
  );
}

export default App;

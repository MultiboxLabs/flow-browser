import { BrowserUI } from "@/components/browser-ui/main";
import { ThemeProvider } from "@/components/main/theme";

function Page() {
  return <BrowserUI />;
}

function App() {
  return (
    <ThemeProvider forceTheme="dark">
      <Page />
    </ThemeProvider>
  );
}
export default App;

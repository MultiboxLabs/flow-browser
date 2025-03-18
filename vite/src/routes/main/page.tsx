import { BrowserUI } from "@/components/browser-ui/main";
import { BrowserProvider } from "@/components/main/browser-context";

function BrowserApp() {
  return <BrowserUI />;
}

function App() {
  return (
    <BrowserProvider>
      <BrowserApp />
    </BrowserProvider>
  );
}

export default App;

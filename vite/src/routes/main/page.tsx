import { BrowserUI } from "@/components/browser-ui/main";
import { BrowserProvider } from "@/components/main/browser-context";
import { PlatformProvider } from "@/components/main/platform";

function BrowserApp() {
  return <BrowserUI />;
}

function App() {
  return (
    <PlatformProvider>
      <BrowserProvider>
        <BrowserApp />
      </BrowserProvider>
    </PlatformProvider>
  );
}

export default App;

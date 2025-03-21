import { Omnibox } from "@/components/omnibox/main";
import { BrowserProvider } from "@/components/main/browser-context";

function OmniboxApp() {
  return <Omnibox />;
}

function App() {
  return (
    <BrowserProvider>
      <OmniboxApp />
    </BrowserProvider>
  );
}

export default App;

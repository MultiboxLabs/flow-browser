import BrowserHeader from "@/components/browser-header";
import BrowserContent from "@/components/browser-content";
import { BrowserProvider, useBrowser } from "@/components/main/browser-context";

function BrowserApp() {
  const {
    tabs,
    addressUrl,
    activeTabId,
    dynamicTitle,
    handleTabClick,
    handleTabClose,
    handleCreateTab,
    setAddressUrl,
    handleAddressUrlSubmit,
    handleGoBack,
    handleGoForward,
    handleReload,
    handleMinimize,
    handleMaximize,
    handleClose
  } = useBrowser();

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      {dynamicTitle && <title>{dynamicTitle} | Flow Browser</title>}
      <BrowserHeader
        tabs={tabs}
        addressUrl={addressUrl}
        onTabClick={handleTabClick}
        onTabClose={handleTabClose}
        onCreateTab={handleCreateTab}
        onAddressChange={setAddressUrl}
        onAddressSubmit={handleAddressUrlSubmit}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      <BrowserContent activeTabId={activeTabId} />
    </div>
  );
}

function App() {
  return (
    <BrowserProvider>
      <BrowserApp />
    </BrowserProvider>
  );
}

export default App;

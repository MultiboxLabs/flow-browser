import BrowserContent from "@/components/browser-ui/browser-content";
import { BrowserSidebar } from "@/components/browser-ui/browser-sidebar";
import { useBrowser } from "@/components/main/browser-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function BrowserUI() {
  const { dynamicTitle } = useBrowser();

  return (
    <SidebarProvider>
      {dynamicTitle && <title>{dynamicTitle} | Flow Browser</title>}
      <BrowserSidebar />
      <SidebarInset>
        <div className="fixed h-2 w-full top-0 bg-transparent app-drag" />
        <BrowserContent />
      </SidebarInset>
    </SidebarProvider>
  );
}

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
        {/* eslint-disable-next-line no-constant-binary-expression */}
        {false && (
          <div className="fixed h-2 w-full top-0 bg-transparent app-drag">
            <div className="flex items-center justify-center w-full">
              <div className="w-10 h-1 bg-white rounded-full" />
            </div>
          </div>
        )}
        <div className="bg-sidebar flex-1 flex p-2 app-drag">
          <BrowserContent />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

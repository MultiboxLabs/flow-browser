import { tabsController } from "@/controllers/tabs-controller";
import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { debugPrint } from "@/modules/output";

export function isValidOpenerUrl(url: string): boolean {
  const urlObject = URL.parse(url);
  if (!urlObject) return false;

  const VALID_PROTOCOLS = ["http:", "https:"];
  if (!VALID_PROTOCOLS.includes(urlObject.protocol)) return false;

  return true;
}

export async function handleOpenUrl(useNewWindow: boolean, url: string) {
  // Find a window to use, show + focus it
  const windows = browserWindowsController.getWindows();
  const focusedWindow = browserWindowsController.getFocusedWindow();
  const hasWindows = windows.length > 0;

  const shouldCreate = useNewWindow || !hasWindows;
  const window = shouldCreate ? await browserWindowsController.create() : focusedWindow ? focusedWindow : windows[0];

  window.show(true);

  // Create a new tab
  const tab = await tabsController.createTab(window.id);
  tab.loadURL(url);
  tabsController.setActiveTab(tab);
}

export function processInitialUrl() {
  const commandLine = process.argv.slice(1);
  const targetUrl = commandLine.pop();
  if (targetUrl && isValidOpenerUrl(targetUrl)) {
    handleOpenUrl(false, targetUrl);
    debugPrint("INITIALIZATION", "initial URL handled");
  }
}

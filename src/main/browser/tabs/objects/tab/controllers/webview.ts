import { Tab } from "@/browser/tabs/objects/tab";
import { Session, WebContents, WebContentsView, WebPreferences } from "electron";

interface PatchedWebContentsView extends WebContentsView {
  destroy: () => void;
}

function createWebContentsView(
  session: Session,
  options: Electron.WebContentsViewConstructorOptions
): PatchedWebContentsView {
  const webContents = options.webContents;
  const webPreferences: WebPreferences = {
    // Merge with any additional preferences
    ...(options.webPreferences || {}),

    // Basic preferences
    sandbox: true,
    webSecurity: true,
    session: session,
    scrollBounce: true,
    safeDialogs: true,
    navigateOnDragDrop: true,
    transparent: true

    // Provide access to 'flow' globals (replaced by implementation in protocols.ts)
    // preload: PATHS.PRELOAD
  };

  const webContentsView = new WebContentsView({
    webPreferences,
    // Only add webContents if it is provided
    ...(webContents ? { webContents } : {})
  });

  webContentsView.setVisible(false);
  return webContentsView as PatchedWebContentsView;
}

export class TabWebviewController {
  private readonly tab: Tab;
  public webContentsView: PatchedWebContentsView | null;
  public webContents: WebContents | null;

  constructor(tab: Tab) {
    this.tab = tab;
    this.webContentsView = null;
    this.webContents = null;
  }

  public get attached() {
    return this.webContentsView !== null;
  }

  public attach() {
    this.tab.throwIfDestroyed();

    if (this.webContentsView) {
      return false;
    }

    const tab = this.tab;
    const creationDetails = tab.creationDetails;

    const webContentsView = createWebContentsView(tab.loadedProfile.session, creationDetails.webContentsViewOptions);
    this.webContentsView = webContentsView;
    this.webContents = webContentsView.webContents;

    this.webContents.on("focus", () => {
      tab.emit("focused");
    });

    tab.navigation.setupWebviewNavigation(this.webContents);
    tab.data.setupWebviewData(this.webContents);

    tab.emit("webview-attached");

    tab.window.updateWebviewWindow();
    tab.bounds.updateWebviewBounds();
    tab.visiblity.updateWebviewVisiblity();

    return true;
  }

  public detach() {
    if (!this.webContentsView) {
      return false;
    }

    const tab = this.tab;

    this.webContentsView.destroy();
    this.webContentsView = null;
    this.webContents = null;

    tab.emit("webview-detached");
    return true;
  }
}

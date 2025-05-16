import { TabbedBrowserWindow } from "@/browser/window";
import { debugPrint } from "@/modules/output";
import { ipcMain, IpcMainEvent, WebContentsView } from "electron";

const DEFAULT_Z_INDEX = 3;
const DEBUG_ENABLE_DEVTOOLS = false;

export function initializePortalComponentWindows(tabbedWindow: TabbedBrowserWindow) {
  const componentViews: { [key: string]: WebContentsView } = {};

  tabbedWindow.window.webContents.setWindowOpenHandler((details) => {
    const { features } = details;
    const componentId = features
      .split(",")
      .find((f) => f.startsWith("componentId="))
      ?.split("=")[1];

    if (!componentId) {
      debugPrint("PORTAL_COMPONENTS", "Portal window opened without componentId, blocking.");
      return { action: "deny" };
    }

    return {
      action: "allow",
      outlivesOpener: true,
      createWindow: ({ webPreferences, ...constructorOptions }) => {
        const componentView = new WebContentsView({
          ...constructorOptions,
          webPreferences: {
            ...webPreferences,
            transparent: true
          }
        });
        const webContents = componentView.webContents;

        componentView.setVisible(false);
        tabbedWindow.viewManager.addOrUpdateView(componentView, DEFAULT_Z_INDEX);

        debugPrint("PORTAL_COMPONENTS", "Created Portal Window:", componentId);

        if (DEBUG_ENABLE_DEVTOOLS) {
          setTimeout(() => {
            if (webContents.isDestroyed()) return;

            webContents.openDevTools({
              mode: "detach"
            });
          }, 1000);
        }

        componentView.webContents.on("destroyed", () => {
          debugPrint("PORTAL_COMPONENTS", "Destroyed Portal Window:", componentId);
          delete componentViews[componentId];
        });

        componentViews[componentId] = componentView;
        return webContents;
      }
    };
  });

  // Connections
  const setComponentWindowBounds = (_event: IpcMainEvent, componentId: string, bounds: Electron.Rectangle) => {
    const componentView = componentViews[componentId];
    if (componentView) {
      debugPrint("PORTAL_COMPONENTS", "Set Bounds of Portal Window:", componentId, bounds);
      componentView.setBounds(bounds);
    }
  };
  ipcMain.on("interface:set-component-window-bounds", setComponentWindowBounds);

  const setComponentWindowZIndex = (_event: IpcMainEvent, componentId: string, zIndex: number) => {
    const componentView = componentViews[componentId];
    if (componentView) {
      debugPrint("PORTAL_COMPONENTS", "Set Z-Index of Portal Window:", componentId, zIndex);
      tabbedWindow.viewManager.addOrUpdateView(componentView, zIndex);
    }
  };
  ipcMain.on("interface:set-component-window-z-index", setComponentWindowZIndex);

  const setComponentWindowVisible = (_event: IpcMainEvent, componentId: string, visible: boolean) => {
    const componentView = componentViews[componentId];
    if (componentView) {
      debugPrint("PORTAL_COMPONENTS", "Set Visibility of Portal Window:", componentId, visible);
      if (visible) {
        // A hack to fix browser flick on extension view opening
        // TODO: Find a better solution
        setTimeout(() => {
          componentView.setVisible(true);
        }, 50);
      } else {
        componentView.setVisible(false);
      }
    }
  };
  ipcMain.on("interface:set-component-window-visible", setComponentWindowVisible);

  // Destroy the component windows
  const destroy = () => {
    ipcMain.off("interface:set-component-window-bounds", setComponentWindowBounds);
    ipcMain.off("interface:set-component-window-z-index", setComponentWindowZIndex);
    ipcMain.off("interface:set-component-window-visible", setComponentWindowVisible);
  };
  return destroy;
}

import { BrowserWindow } from "@/controllers/windows-controller/types";
import { Layer } from "@/controllers/windows-controller/layer-manager";
import { debugPrint } from "@/modules/output";
import { createModalTo, focusPriorities, type LayerType, zIndexes } from "~/layers";
import { ipcMain, IpcMainEvent, WebContentsView } from "electron";

const DEBUG_ENABLE_DEVTOOLS = false;

type ComponentWindow = {
  id: string;
  view: WebContentsView;
};

const isLayerType = (layerType: string | undefined): layerType is LayerType => {
  return layerType !== undefined && layerType in zIndexes;
};

class WindowComponent {
  public readonly id: string;
  public readonly view: WebContentsView;
  public readonly layerType: LayerType;

  private readonly browserWindow: BrowserWindow;
  private readonly layer: Layer<WebContentsView>;
  private destroyed = false;

  constructor(browserWindow: BrowserWindow, componentWindow: ComponentWindow, layerType: LayerType) {
    this.browserWindow = browserWindow;
    this.id = componentWindow.id;
    this.view = componentWindow.view;
    this.layerType = layerType;
    this.layer = new Layer(
      browserWindow.layerManager,
      this.view,
      zIndexes[layerType],
      focusPriorities[layerType],
      createModalTo(layerType)
    );
    browserWindow.layerManager.push(this.layer);
  }

  public setVisible(visible: boolean) {
    this.layer.setVisible(visible);
  }

  public focus() {
    if (!this.view.webContents.isDestroyed()) {
      this.layer.focus();
    }
  }

  public destroy() {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    if (!this.view.webContents.isDestroyed()) {
      this.layer.setVisible(false);
    }
    this.browserWindow.layerManager.pop(this.layer);
  }
}

class ComponentsManager {
  private readonly browserWindow: BrowserWindow;
  private readonly standbyWindows = new Map<string, ComponentWindow>();
  private readonly components = new Map<string, WindowComponent>();

  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  public addStandbyWindow(componentId: string, view: WebContentsView) {
    this.standbyWindows.set(componentId, {
      id: componentId,
      view
    });
  }

  public destroyWindow(componentId: string) {
    const component = this.components.get(componentId);
    if (component) {
      component.destroy();
      this.components.delete(componentId);
    }
    this.standbyWindows.delete(componentId);
  }

  public setBounds(componentId: string, bounds: Electron.Rectangle) {
    const componentWindow = this.getComponentWindow(componentId);
    if (componentWindow) {
      componentWindow.view.setBounds(bounds);
    }
  }

  public allocate(componentId: string, layerType: LayerType | undefined, visible = true) {
    if (!isLayerType(layerType)) {
      debugPrint("PORTAL_COMPONENTS", "Portal window allocation without valid layerType, ignoring.");
      return;
    }

    const instance = this.take(componentId, layerType);
    if (instance == null) {
      debugPrint(
        "PORTAL_COMPONENTS",
        "Portal allocate skipped: missing standby window (timing/registration?):",
        componentId,
        layerType
      );
      return;
    }

    instance.setVisible(visible);
  }

  public setVisible(componentId: string, visible: boolean) {
    const component = this.components.get(componentId);
    if (component) {
      component.setVisible(visible);
      return;
    }

    this.standbyWindows.get(componentId)?.view.setVisible(false);
  }

  public release(componentId: string) {
    const component = this.components.get(componentId);
    if (!component) {
      this.standbyWindows.get(componentId)?.view.setVisible(false);
      return;
    }

    component.destroy();
    this.components.delete(componentId);
  }

  public focus(componentId: string) {
    this.components.get(componentId)?.focus();
  }

  private take(componentId: string, layerType: LayerType) {
    const component = this.components.get(componentId);
    if (component) {
      if (component.layerType !== layerType) {
        debugPrint(
          "PORTAL_COMPONENTS",
          "Portal window layerType changed before release, keeping existing component:",
          component.layerType,
          layerType
        );
      }
      return component;
    }

    const componentWindow = this.standbyWindows.get(componentId);
    if (!componentWindow) {
      return null;
    }

    const nextComponent = new WindowComponent(this.browserWindow, componentWindow, layerType);
    this.components.set(componentId, nextComponent);
    return nextComponent;
  }

  private getComponentWindow(componentId: string) {
    const component = this.components.get(componentId);
    if (component) {
      return {
        id: component.id,
        view: component.view
      };
    }

    return this.standbyWindows.get(componentId) ?? null;
  }
}

export function initializePortalComponentWindows(browserWindow: BrowserWindow) {
  const componentsManager = new ComponentsManager(browserWindow);

  const electronWindow = browserWindow.browserWindow;
  electronWindow.webContents.setWindowOpenHandler((details) => {
    const { features } = details;
    const parsedFeatures = new Map(features.split(",").map((feature) => feature.trim().split("=") as [string, string]));
    const componentId = parsedFeatures.get("componentId");

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
          componentsManager.destroyWindow(componentId);
          debugPrint("PORTAL_COMPONENTS", "Destroyed Portal Window:", componentId);
        });

        componentsManager.addStandbyWindow(componentId, componentView);
        return webContents;
      }
    };
  });

  // Connections
  const setComponentWindowBounds = (_event: IpcMainEvent, componentId: string, bounds: Electron.Rectangle) => {
    debugPrint("PORTAL_COMPONENTS", "Set Bounds of Portal Window:", componentId, bounds);
    componentsManager.setBounds(componentId, bounds);
  };
  ipcMain.on("interface:set-component-window-bounds", setComponentWindowBounds);

  const allocateComponentWindow = (
    _event: IpcMainEvent,
    componentId: string,
    layerType: LayerType | undefined,
    visible = true
  ) => {
    debugPrint("PORTAL_COMPONENTS", "Allocate Portal Window:", componentId, layerType, visible);
    componentsManager.allocate(componentId, layerType, visible);
  };
  ipcMain.on("interface:allocate-component-window", allocateComponentWindow);

  const setComponentWindowVisible = (_event: IpcMainEvent, componentId: string, visible: boolean) => {
    debugPrint("PORTAL_COMPONENTS", "Set Visibility of Portal Window:", componentId, visible);
    componentsManager.setVisible(componentId, visible);
  };
  ipcMain.on("interface:set-component-window-visible", setComponentWindowVisible);

  const releaseComponentWindow = (_event: IpcMainEvent, componentId: string) => {
    debugPrint("PORTAL_COMPONENTS", "Release Portal Window:", componentId);
    componentsManager.release(componentId);
  };
  ipcMain.on("interface:release-component-window", releaseComponentWindow);

  const focusComponentWindow = (_event: IpcMainEvent, componentId: string) => {
    debugPrint("PORTAL_COMPONENTS", "Focus Portal Window:", componentId);
    componentsManager.focus(componentId);
  };
  ipcMain.on("interface:focus-component-window", focusComponentWindow);

  // Destroy the component windows
  const destroy = () => {
    ipcMain.off("interface:set-component-window-bounds", setComponentWindowBounds);
    ipcMain.off("interface:allocate-component-window", allocateComponentWindow);
    ipcMain.off("interface:set-component-window-visible", setComponentWindowVisible);
    ipcMain.off("interface:release-component-window", releaseComponentWindow);
    ipcMain.off("interface:focus-component-window", focusComponentWindow);
  };
  return destroy;
}

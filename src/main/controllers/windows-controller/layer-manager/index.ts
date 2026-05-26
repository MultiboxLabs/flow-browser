import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import type { BrowserWindow } from "../types/browser";
import { WebContentsView } from "electron";

export class Layer<ViewType extends Electron.View = Electron.View> {
  private readonly manager: LayerManager;

  public readonly view: ViewType;
  public readonly zIndex: number;
  public readonly focusPriority: number;
  public readonly modalTo: (zIndex: number) => boolean;

  constructor(
    manager: LayerManager,
    view: ViewType,
    zIndex: number,
    focusPriority: number,
    modalTo: (zIndex: number) => boolean = () => false
  ) {
    this.manager = manager;

    this.view = view;
    this.zIndex = zIndex;
    this.focusPriority = focusPriority;
    this.modalTo = modalTo;

    // Non-web contents views are not focusable, so they have the lowest priority
    if (!this.isWebContentsView()) {
      this.focusPriority = -1;
    }
  }

  public isWebContentsView(): this is Layer<WebContentsView> {
    return this.view instanceof WebContentsView;
  }

  public isFocused(): boolean {
    if (this.isWebContentsView()) {
      return this.view.webContents.isFocused();
    }
    return false;
  }
  public focus() {
    if (this.isWebContentsView()) {
      // check if its focusable (there might be modal layers on top blocking it)
      const modalLayers = this.manager.getModalLayersFor(this.zIndex);
      if (modalLayers.length > 0) {
        return false;
      }

      this.view.webContents.focus();
      this.manager.clearPendingFocusReallocation();
      return true;
    }
    return false;
  }

  private _visibilityChanging(oldVisible: boolean, newVisible: boolean) {
    const wasFocused = this.isFocused();
    const focusedLayer = this.manager.getFocusedLayer();
    const shouldReallocate =
      oldVisible === true &&
      newVisible === false &&
      (wasFocused || !focusedLayer || (focusedLayer !== this && this.modalTo(focusedLayer.zIndex)));
    if (shouldReallocate) {
      // wait for layer to be hidden
      setImmediate(() => this.manager.reallocateFocus());
    }
  }

  public isVisible(): boolean {
    return this.view.getVisible();
  }
  public setVisible(visible: boolean) {
    const oldVisible = this.isVisible();
    if (oldVisible === visible) {
      return;
    }
    this._visibilityChanging(oldVisible, visible);
    this.view.setVisible(visible);
  }

  public addThisAsChildView(parentView: Electron.View) {
    parentView.addChildView(this.view);
  }
  public removeThisFromParentView(parentView: Electron.View) {
    parentView.removeChildView(this.view);
  }
}

type LayerManagerEvents = {
  "layer-added": [layer: Layer];
  "layer-removed": [layer: Layer];
};

export class LayerManager extends TypedEventEmitter<LayerManagerEvents> {
  private readonly parentView: Electron.View;
  private readonly browserWindow: Electron.BrowserWindow;

  private layers: Layer[] = [];
  private oldLayers: Layer[] = [];
  private readonly layersWithDestroyListener = new WeakSet<Layer>();

  // Deferred focus reallocation: when reallocateFocus is called while the
  // window is NOT focused, we defer until the window regains focus. This
  // prevents webContents.focus() from stealing OS focus to a background window.
  private _focusReallocatePending = false;

  constructor(window: BrowserWindow) {
    super();

    this.parentView = window.browserWindow.contentView;
    this.browserWindow = window.browserWindow;

    // When the window gains focus, run deferred focus reallocation (once)
    this.browserWindow.on("focus", () => {
      if (this._focusReallocatePending) {
        this._focusReallocatePending = false;
        this.reallocateFocus();
      }
    });
  }

  /**
   * Get all layers that are modal to the given zIndex.
   * @param zIndex - The zIndex to get modal layers for.
   * @returns The modal layers.
   */
  public getModalLayersFor(zIndex: number): Layer[] {
    return this.layers
      .filter((layer) => layer.modalTo(zIndex) && layer.isVisible() && layer.zIndex > zIndex)
      .toSorted((a, b) => b.zIndex - a.zIndex);
  }

  private isLayerUsable(layer: Layer): boolean {
    if (!layer.isWebContentsView()) {
      return true;
    }

    const webContents = layer.view.webContents;
    return webContents !== undefined && !webContents.isDestroyed();
  }

  private _layersChanged() {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);

    const oldLayers = this.oldLayers;
    const newLayers = this.layers;

    // Remove old layers that are not used anymore
    const adjustedOldLayers: Layer[] = [];
    for (const oldLayer of oldLayers) {
      if (!newLayers.includes(oldLayer)) {
        oldLayer.removeThisFromParentView(this.parentView);
      } else {
        adjustedOldLayers.push(oldLayer);
      }
    }

    // addChildView moves a sibling to the top. Matching LayerManager (low z → high z),
    // a full reorder is equivalent to addChildView for every layer in that order. The
    // bottom stack that already matches can be skipped: from the first index where the
    // old survivor order diverges, re-add through the end (e.g. old L1,L2,L4 → new
    // L1,L2,L3,L4 only touches L3 then L4).
    let prefix = 0;
    const prefixLimit = Math.min(adjustedOldLayers.length, newLayers.length);
    while (prefix < prefixLimit && adjustedOldLayers[prefix] === newLayers[prefix]) {
      prefix++;
    }

    for (let i = prefix; i < newLayers.length; i++) {
      const newLayer = newLayers[i];
      newLayer.addThisAsChildView(this.parentView);
    }

    this.oldLayers = [...newLayers];
  }

  /**
   * The focused layer is no longer there, so we need to find a new one to focus.
   * If the window is not currently focused, defers until it regains focus to avoid
   * stealing OS focus from the active window via webContents.focus().
   */
  public reallocateFocus() {
    if (this.browserWindow.isDestroyed()) return;

    if (!this.browserWindow.isFocused()) {
      this._focusReallocatePending = true;
      return;
    }

    this._focusReallocatePending = false;

    const layers = this.layers
      .filter((layer) => layer.isVisible())
      .toSorted((a, b) => b.focusPriority - a.focusPriority);

    for (const layer of layers) {
      if (layer.focus()) {
        return;
      }
    }
  }

  public clearPendingFocusReallocation(): void {
    this._focusReallocatePending = false;
  }

  public getFocusedLayer(): Layer | null {
    return this.layers.find((layer) => layer.isFocused()) ?? null;
  }

  private _layerAdded(layer: Layer) {
    this.emit("layer-added", layer);
  }
  private _layerRemoving(layer: Layer) {
    if (layer.isFocused()) {
      // wait for layer to be removed
      setImmediate(() => this.reallocateFocus());
    }
    this.emit("layer-removed", layer);
  }

  private removeDestroyedLayer(layer: Layer) {
    const hadLayer = this.layers.includes(layer);
    this.layers = this.layers.filter((l) => l !== layer);
    this.oldLayers = this.oldLayers.filter((l) => l !== layer);

    if (hadLayer) {
      this.emit("layer-removed", layer);
      setImmediate(() => this.reallocateFocus());
      layer.removeThisFromParentView(this.parentView);
    }
  }

  private ensureDestroyListener(layer: Layer) {
    if (!layer.isWebContentsView() || this.layersWithDestroyListener.has(layer)) {
      return;
    }

    this.layersWithDestroyListener.add(layer);
    layer.view.webContents.once("destroyed", () => {
      this.removeDestroyedLayer(layer);
    });
  }

  public push(layer: Layer) {
    if (!this.isLayerUsable(layer)) {
      return false;
    }
    if (this.layers.includes(layer)) {
      return false;
    }
    this.ensureDestroyListener(layer);
    this.layers.push(layer);
    this._layersChanged();
    this._layerAdded(layer);
    return true;
  }
  public pop(layer: Layer) {
    if (!this.layers.includes(layer)) {
      return false;
    }
    this.layers.splice(this.layers.indexOf(layer), 1);
    this._layerRemoving(layer);
    this._layersChanged();
    return true;
  }

  public destroy(dontRemoveViews: boolean = false) {
    if (!dontRemoveViews) {
      for (const layer of this.layers) {
        try {
          layer.removeThisFromParentView(this.parentView);
        } catch (error) {
          console.warn(`Failed to remove view ${layer.view} during destroy:`, error);
        }
      }
    }

    this.layers = [];
    this.oldLayers = [];
  }
}

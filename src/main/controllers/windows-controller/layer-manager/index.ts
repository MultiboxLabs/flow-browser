import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { BrowserWindow } from "../types/browser";
import { WebContentsView } from "electron";

class Layer<ViewType extends Electron.View = Electron.View> {
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
    modalTo: (zIndex: number) => boolean
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
      return true;
    }
    return false;
  }

  private _visibilityChanged(oldVisible: boolean, newVisible: boolean) {
    if (oldVisible === true && newVisible === false && this.isFocused()) {
      this.manager.reallocateFocus();
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
    this._visibilityChanged(oldVisible, visible);
    this.view.setVisible(visible);
  }
}

type LayerManagerEvents = {
  "layer-added": [layer: Layer];
  "layer-removed": [layer: Layer];
};

class LayerManager extends TypedEventEmitter<LayerManagerEvents> {
  private readonly window: BrowserWindow;
  private readonly parentView: Electron.View;

  private layers: Layer[] = [];
  private oldLayers: Layer[] = [];

  constructor(window: BrowserWindow) {
    super();

    this.window = window;
    this.parentView = window.browserWindow.contentView;
  }

  public getModalLayersFor(zIndex: number): Layer[] {
    return this.layers.filter((layer) => layer.modalTo(zIndex)).toSorted((a, b) => b.zIndex - a.zIndex);
  }

  private _layersChanged() {
    this.layers.sort((a, b) => a.zIndex - b.zIndex);

    const oldLayers = this.oldLayers;
    const newLayers = this.layers;

    // Remove old layers that are not used anymore
    const adjustedOldLayers: Layer[] = [];
    for (const oldLayer of oldLayers) {
      if (!newLayers.includes(oldLayer)) {
        this.parentView.removeChildView(oldLayer.view);
      } else {
        adjustedOldLayers.push(oldLayer);
      }
    }

    // addChildView moves a sibling to the top. Matching ViewManager (low z → high z),
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
      this.parentView.addChildView(newLayers[i].view);
    }

    this.oldLayers = [...newLayers];
  }

  /**
   * The focused layer is no longer there, so we need to find a new one to focus.
   */
  public reallocateFocus() {
    const layers = this.layers.toSorted((a, b) => b.focusPriority - a.focusPriority);
    const prioritisedLayer = layers[0];
    if (prioritisedLayer) {
      prioritisedLayer.focus();
    }
  }

  public getFocusedLayer(): Layer | null {
    return this.layers.find((layer) => layer.isFocused()) ?? null;
  }

  private _layerAdded(layer: Layer) {
    this.emit("layer-added", layer);
  }
  private _layerRemoving(layer: Layer) {
    if (layer.isFocused()) {
      this.reallocateFocus();
    }
    this.emit("layer-removed", layer);
  }

  public push(layer: Layer) {
    if (this.layers.includes(layer)) {
      return false;
    }
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
}

import { fromPointer } from "objc-js";
import {
  NSSplitViewController,
  NSSplitViewItem,
  NSToolbar,
  NSToolbarDisplayMode,
  NSViewController,
  NSVisualEffectBlendingMode,
  NSVisualEffectMaterial,
  NSVisualEffectState,
  NSVisualEffectView,
  NSWindowStyleMask,
  NSWindowTitleVisibility,
  NSWindowToolbarStyle,
  _NSSplitViewController,
  _NSSplitViewItem,
  _NSToolbar,
  _NSView,
  _NSViewController,
  _NSVisualEffectView
} from "objcjs-types/AppKit";
import { CGRect } from "objcjs-types/structs";
import { NSStringFromString } from "objcjs-types/helpers";
import { macOS, isAtLeast } from "objcjs-types/osversion";

interface AppKitSidebarHost {
  splitViewController: _NSSplitViewController;
  sidebarViewController: _NSViewController;
  contentViewController: _NSViewController;
  sidebarItem: _NSSplitViewItem;
  contentItem: _NSSplitViewItem;
  sidebarView: _NSVisualEffectView;
  toolbar: _NSToolbar | null;
}

const appKitSidebarHosts = new WeakMap<Electron.BaseWindow, AppKitSidebarHost>();
const defaultAppKitSidebarWidth = 1;

export function hasLiquidGlass() {
  return isAtLeast(macOS.Tahoe);
}

/**
 * Adds a hidden (collapsed) macOS AppKit sidebar to the window.
 * This is used to make macOS use a different border radius meant for windows with sidebars.
 * @param window - The window to add the sidebar effect to.
 * @param sidebarWidth - The width of the sidebar.
 * @returns True if the sidebar effect was added, false otherwise.
 */
export function addAppKitSidebarEffect(
  window: Electron.BaseWindow,
  hidden = true,
  sidebarWidth = defaultAppKitSidebarWidth
) {
  if (window.isDestroyed()) return false;
  if (appKitSidebarHosts.has(window)) return true;

  const pointer = window.getNativeWindowHandle();
  const view = fromPointer(pointer) as _NSView;
  if (!view) return false;

  const nativeWindow = view.window();
  if (!nativeWindow) return false;

  const width = Math.max(1, sidebarWidth);
  const frame = view.frame();
  const sidebarHeight = Math.max(400, frame.size.height);

  nativeWindow.setTitleVisibility$(NSWindowTitleVisibility.NSWindowTitleHidden);
  nativeWindow.setTitlebarAppearsTransparent$(true);
  nativeWindow.setStyleMask$(nativeWindow.styleMask() | NSWindowStyleMask.FullSizeContentView);

  if (isAtLeast(macOS.BigSur)) {
    nativeWindow.setToolbarStyle$(NSWindowToolbarStyle.Unified);
  }

  let toolbar = nativeWindow.toolbar();
  if (!toolbar) {
    toolbar = NSToolbar.alloc().initWithIdentifier$(NSStringFromString("ElectronSidebarToolbar"));
    toolbar.setShowsBaselineSeparator$(false);
    toolbar.setDisplayMode$(NSToolbarDisplayMode.IconOnly);
    nativeWindow.setToolbar$(toolbar);
  }

  view.removeFromSuperview();

  const contentViewController = NSViewController.alloc().init();
  contentViewController.setView$(view);

  const sidebarView = NSVisualEffectView.alloc().initWithFrame$(CGRect(0, 0, width, sidebarHeight));
  sidebarView.setMaterial$(NSVisualEffectMaterial.Sidebar);
  sidebarView.setBlendingMode$(NSVisualEffectBlendingMode.BehindWindow);
  sidebarView.setState$(NSVisualEffectState.FollowsWindowActiveState);

  const sidebarViewController = NSViewController.alloc().init();
  sidebarViewController.setView$(sidebarView);

  const splitViewController = NSSplitViewController.alloc().init();
  const sidebarItem = NSSplitViewItem.sidebarWithViewController$(sidebarViewController);
  sidebarItem.setMinimumThickness$(width);
  sidebarItem.setMaximumThickness$(width);
  if (hidden) {
    sidebarItem.setCollapsed$(true);
  }
  sidebarItem.setCanCollapse$(false);

  const contentItem = NSSplitViewItem.splitViewItemWithViewController$(contentViewController);

  splitViewController.addSplitViewItem$(sidebarItem);
  splitViewController.addSplitViewItem$(contentItem);

  nativeWindow.setContentViewController$(splitViewController);
  nativeWindow.layoutIfNeeded();

  appKitSidebarHosts.set(window, {
    splitViewController,
    sidebarViewController,
    contentViewController,
    sidebarItem,
    contentItem,
    sidebarView,
    toolbar
  });

  return true;
}

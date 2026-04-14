import { browserWindowsController } from "@/controllers/windows-controller/interfaces/browser";
import { BrowserWindow } from "@/controllers/windows-controller/types";
import contextMenu from "electron-context-menu";
import { Tab } from "./tab";
import { TabsController } from "./index";

// Define types for navigation history
interface NavigationHistory {
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;
}

// Define interface for menu actions
type MenuItemFunction = (options: Record<string, unknown>) => Electron.MenuItemConstructorOptions;
type InspectFunction = () => Electron.MenuItemConstructorOptions;

interface MenuActions {
  lookUpSelection: MenuItemFunction;
  copyLink: MenuItemFunction;
  cut: MenuItemFunction;
  copy: MenuItemFunction;
  paste: MenuItemFunction;
  selectAll: MenuItemFunction;
  inspect: InspectFunction;
  copyImage: MenuItemFunction;
  copyImageAddress: MenuItemFunction;
  separator: InspectFunction;
  [key: string]: MenuItemFunction | InspectFunction;
}

export function createTabContextMenu(
  tabsController: TabsController,
  tab: Tab,
  profileId: string,
  window: BrowserWindow,
  spaceId: string
) {
  const webContents = tab.webContents;
  if (!webContents) return;

  contextMenu({
    window: webContents,
    menu(defaultActions, parameters, _browserWindow, dictionarySuggestions): Electron.MenuItemConstructorOptions[] {
      const navigationHistory = webContents.navigationHistory as NavigationHistory;
      const canGoBack = navigationHistory.canGoBack();
      const canGoForward = navigationHistory.canGoForward();
      const lookUpSelection = defaultActions.lookUpSelection({});
      const searchEngine = "Google";

      // Helper function to create a new tab
      const createNewTab = async (url: string, overrideWindow?: BrowserWindow) => {
        const sourceTab = await tabsController.createTab(
          overrideWindow ? overrideWindow.id : window.id,
          profileId,
          spaceId,
          undefined,
          { url }
        );
        tabsController.activateTab(sourceTab);
      };

      // Create all menu sections
      const openLinkItems = createOpenLinkItems(parameters, createNewTab);
      const linkItems = createLinkItems(defaultActions as MenuActions);
      const navigationItems = createNavigationItems(navigationHistory, webContents, canGoBack, canGoForward);
      const extensionItems = createExtensionItems(tab, webContents, parameters);
      const textHistoryItems = createTextHistoryItems(webContents);
      const textEditItems = createTextEditItems(defaultActions as MenuActions, webContents);
      const selectionItems = createSelectionItems(
        defaultActions as MenuActions,
        parameters,
        createNewTab,
        searchEngine
      );
      const imageItems = createImageItems(parameters, createNewTab, defaultActions as MenuActions);

      // Assemble sections in correct order
      const sections: Electron.MenuItemConstructorOptions[][] = [];
      const hasDictionarySuggestions = dictionarySuggestions.some((suggestion) => suggestion.visible);
      if (hasDictionarySuggestions) {
        sections.push(dictionarySuggestions);
      }

      let noSpecialActions = false;
      const hasLink = !!parameters.linkURL;
      const hasLookUpSelection = lookUpSelection.visible;

      if (hasLink) {
        sections.push(openLinkItems);
        sections.push(linkItems);
      } else if (hasLookUpSelection && parameters.selectionText.trim()) {
        sections.push([lookUpSelection]);
      } else if (parameters.hasImageContents) {
        sections.push(imageItems);
      } else {
        noSpecialActions = true;
        sections.push(navigationItems);
      }

      if (parameters.selectionText.trim() && !parameters.isEditable) {
        sections.push(selectionItems);
      }

      if (parameters.isEditable) {
        sections.push(textHistoryItems);
        sections.push(textEditItems);
      }

      sections.push(extensionItems);

      const devItems = createDevItems(parameters, defaultActions, createNewTab, noSpecialActions);
      sections.push(devItems);

      // Combine all sections with separators
      return combineSections(sections, defaultActions as MenuActions);
    }
  });
}

function createOpenLinkItems(
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string, window?: BrowserWindow) => Promise<void>
): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: "Open Link in New Tab",
      click: () => {
        createNewTab(parameters.linkURL);
      }
    },
    {
      label: "Open Link in New Window",
      click: async () => {
        const newWindow = await browserWindowsController.create();
        createNewTab(parameters.linkURL, newWindow);
      }
    }
  ];
}

function createLinkItems(defaultActions: MenuActions): Electron.MenuItemConstructorOptions[] {
  const copyLinkItem = defaultActions.copyLink({});
  copyLinkItem.label = "Copy Link Address";
  copyLinkItem.visible = true;
  return [copyLinkItem];
}

function createNavigationItems(
  navigationHistory: NavigationHistory,
  webContents: Electron.WebContents,
  canGoBack: boolean,
  canGoForward: boolean
): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: "Back",
      click: () => {
        navigationHistory.goBack();
      },
      enabled: canGoBack
    },
    {
      label: "Forward",
      click: () => {
        navigationHistory.goForward();
      },
      enabled: canGoForward
    },
    {
      label: "Reload",
      click: () => {
        webContents.reload();
      },
      enabled: true
    }
  ];
}

function createExtensionItems(
  tab: Tab,
  webContents: Electron.WebContents,
  parameters: Electron.ContextMenuParams
): Electron.MenuItemConstructorOptions[] {
  const extensions = tab.loadedProfile.extensions;
  // @ts-expect-error: ts error, but still works
  const items: Electron.MenuItemConstructorOptions[] = extensions.getContextMenuItems(webContents, parameters);
  return items;
}

function createTextHistoryItems(webContents: Electron.WebContents): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: "Undo",
      click: () => {
        webContents.undo();
      },
      enabled: true
    },
    {
      label: "Redo",
      click: () => {
        webContents.redo();
      },
      enabled: true
    }
  ];
}

function createTextEditItems(
  defaultActions: MenuActions,
  webContents: Electron.WebContents
): Electron.MenuItemConstructorOptions[] {
  return [
    defaultActions.cut({}),
    defaultActions.copy({}),
    defaultActions.paste({}),
    {
      label: "Paste and Match Style",
      click: () => {
        webContents.pasteAndMatchStyle();
      },
      enabled: true
    },
    defaultActions.selectAll({})
  ];
}

function createSelectionItems(
  defaultActions: MenuActions,
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string) => Promise<void>,
  searchEngine: string
): Electron.MenuItemConstructorOptions[] {
  const selectionText = parameters.selectionText;

  let displaySelectionText = selectionText;
  if (displaySelectionText.length > 45) {
    const newDisplaySelectionText = selectionText.slice(0, 45).trim() + "...";
    displaySelectionText = newDisplaySelectionText;
  }

  return [
    defaultActions.copy({}),
    {
      label: `Search ${searchEngine} for "${displaySelectionText}"`,
      click: () => {
        const searchURL = new URL("https://www.google.com/search");
        searchURL.searchParams.set("q", selectionText);
        createNewTab(searchURL.toString());
      }
    }
  ];
}

function createDevItems(
  parameters: Electron.ContextMenuParams,
  defaultActions: MenuActions,
  createNewTab: (url: string) => Promise<void>,
  noSpecialActions: boolean
): Electron.MenuItemConstructorOptions[] {
  const currentFrame = parameters.frame;
  const topFrame = currentFrame?.top || currentFrame;
  const isTopFrame = currentFrame === topFrame;

  const topFrameUrl = topFrame?.url;
  const currentFrameUrl = currentFrame?.url;

  const devItems: Electron.MenuItemConstructorOptions[] = [];

  if (topFrameUrl) {
    devItems.push({
      label: "View Page Source",
      click: () => {
        createNewTab(`view-source:${topFrameUrl}`);
      },
      visible: noSpecialActions
    });
  }

  if (!isTopFrame && currentFrameUrl) {
    devItems.push({
      label: "View Frame Source",
      click: () => {
        createNewTab(`view-source:${currentFrameUrl}`);
      },
      visible: noSpecialActions
    });
  }

  devItems.push(defaultActions.inspect());
  return devItems;
}

function createImageItems(
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string) => Promise<void>,
  defaultActions: MenuActions
): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: "Open Image in New Tab",
      click: () => {
        createNewTab(parameters.srcURL);
      }
    },
    defaultActions.copyImage({}),
    defaultActions.copyImageAddress({})
  ];
}

function combineSections(
  sections: Electron.MenuItemConstructorOptions[][],
  defaultActions: MenuActions
): Electron.MenuItemConstructorOptions[] {
  const combinedSections: Electron.MenuItemConstructorOptions[] = [];

  sections.forEach((section, index) => {
    // Only add non-empty sections
    if (section.length > 0) {
      combinedSections.push(...section);

      // Add separator if this isn't the last section
      if (index < sections.length - 1) {
        combinedSections.push(defaultActions.separator());
      }
    }
  });

  return combinedSections;
}

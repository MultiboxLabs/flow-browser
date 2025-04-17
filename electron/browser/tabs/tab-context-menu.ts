import { Browser } from "@/browser/browser";
import { Tab } from "@/browser/tabs/tab";
import { TabbedBrowserWindow } from "@/browser/window";

// @ts-expect-error: Webpack will handle this :)
import contextMenu from "electron-context-menu";

export function createTabContextMenu(
  browser: Browser,
  tab: Tab,
  profileId: string,
  tabbedWindow: TabbedBrowserWindow,
  spaceId: string
) {
  const webContents = tab.webContents;

  contextMenu({
    window: webContents,
    menu(
      defaultActions,
      parameters,
      _browserWindow,
      dictionarySuggestions,
      _event
    ): Electron.MenuItemConstructorOptions[] {
      const navigationHistory = webContents.navigationHistory;
      const canGoBack = navigationHistory.canGoBack();
      const canGoForward = navigationHistory.canGoForward();
      const lookUpSelection = defaultActions.lookUpSelection({});
      const searchEngine = "Google";

      // Helper function to create a new tab
      const createNewTab = async (url: string, window?: TabbedBrowserWindow) => {
        const sourceTab = await browser.tabs.createTab(window ? window.id : tabbedWindow.id, profileId, spaceId);
        sourceTab.loadURL(url);
        browser.tabs.setActiveTab(sourceTab);
      };

      // Create all menu sections
      const openLinkItems = createOpenLinkItems(parameters, createNewTab, browser);
      const linkItems = createLinkItems(defaultActions);
      const navigationItems = createNavigationItems(navigationHistory, webContents, canGoBack, canGoForward);
      const extensionItems = createExtensionItems();
      const textHistoryItems = createTextHistoryItems(webContents);
      const textEditItems = createTextEditItems(defaultActions, webContents);
      const selectionItems = createSelectionItems(defaultActions, parameters, createNewTab, searchEngine);
      const devItems = createDevItems(defaultActions);
      const imageItems = createImageItems(parameters, createNewTab, defaultActions);

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
      } else {
        noSpecialActions = true;
        sections.push(navigationItems);
      }

      if (parameters.hasImageContents) {
        sections.push(imageItems);
      }

      if (parameters.selectionText.trim() && !parameters.isEditable) {
        sections.push(selectionItems);
      }

      if (parameters.isEditable) {
        sections.push(textHistoryItems);
        sections.push(textEditItems);
      }

      sections.push(extensionItems);
      sections.push([
        {
          label: "View Page Source",
          click: () => {
            createNewTab(`view-source:${webContents.getURL()}`);
          },
          visible: noSpecialActions
        },
        ...devItems
      ]);

      // Combine all sections with separators
      return combineSections(sections, defaultActions);
    }
  });
}

function createOpenLinkItems(
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string, window?: TabbedBrowserWindow) => Promise<void>,
  browser: Browser
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
        const newWindow = await browser.createWindow("normal");
        createNewTab(parameters.linkURL, newWindow);
      }
    }
  ];
}

function createLinkItems(defaultActions: any): Electron.MenuItemConstructorOptions[] {
  const copyLinkItem = defaultActions.copyLink({});
  copyLinkItem.visible = true;
  return [copyLinkItem];
}

function createNavigationItems(
  navigationHistory: any,
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

function createExtensionItems(): Electron.MenuItemConstructorOptions[] {
  // TODO: Add extension items
  return [];
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
  defaultActions: any,
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
  defaultActions: any,
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string) => Promise<void>,
  searchEngine: string
): Electron.MenuItemConstructorOptions[] {
  return [
    defaultActions.copy({}),
    {
      label: `Search ${searchEngine} for "${parameters.selectionText}"`,
      click: () => {
        const searchURL = new URL("https://www.google.com/search");
        searchURL.searchParams.set("q", parameters.selectionText);
        createNewTab(searchURL.toString());
      }
    }
  ];
}

function createDevItems(defaultActions: any): Electron.MenuItemConstructorOptions[] {
  return [defaultActions.inspect()];
}

function createImageItems(
  parameters: Electron.ContextMenuParams,
  createNewTab: (url: string) => Promise<void>,
  defaultActions: any
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
  defaultActions: any
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

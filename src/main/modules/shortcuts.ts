import { getAllModifiedShortcuts } from "@/saving/shortcuts";
import { ShortcutAction } from "~/types/shortcuts";

const typedShortcuts = [
  // Tabs
  {
    id: "tabs.new",
    name: "New Tab",
    shortcut: "CommandOrControl+T",
    category: "Tabs"
  },

  // Tab
  {
    id: "tab.copyUrl",
    name: "Copy URL",
    shortcut: "CommandOrControl+Shift+C",
    category: "Tab"
  },
  {
    id: "tab.reload",
    name: "Reload",
    shortcut: "CommandOrControl+R",
    category: "Tab"
  },
  {
    id: "tab.forceReload",
    name: "Force Reload",
    shortcut: "Shift+CommandOrControl+R",
    category: "Tab"
  },
  {
    id: "tab.close",
    name: "Close Tab",
    shortcut: "CommandOrControl+W",
    category: "Tab"
  },
  {
    id: "tab.toggleDevTools",
    name: "Toggle DevTools",
    shortcut: "F12",
    category: "Tab"
  },

  // Navigation
  {
    id: "navigation.goBack",
    name: "Go Back",
    shortcut: "CommandOrControl+Left",
    category: "Navigation"
  },
  {
    id: "navigation.goForward",
    name: "Go Forward",
    shortcut: "CommandOrControl+Right",
    category: "Navigation"
  },

  // Browser
  {
    id: "browser.newWindow",
    name: "New Window",
    shortcut: "CommandOrControl+N",
    category: "Browser"
  },
  {
    id: "browser.toggleSidebar",
    name: "Toggle Sidebar",
    shortcut: "CommandOrControl+S",
    category: "Browser"
  },
  {
    id: "browser.openSettings",
    name: "Open Settings",
    shortcut: "CommandOrControl+,",
    category: "Browser"
  }
] as const satisfies ShortcutAction[];

type ShortcutId = (typeof typedShortcuts)[number]["id"];

const shortcuts: ShortcutAction[] = typedShortcuts;

export function getShortcuts() {
  const modifiedShortcutsData = getAllModifiedShortcuts();

  const updatedShortcuts = shortcuts.map((shortcut) => {
    const modifiedShortcutData = modifiedShortcutsData.find(({ id }) => id === shortcut.id);
    return {
      ...shortcut,
      originalShortcut: shortcut.shortcut,
      shortcut: modifiedShortcutData?.newShortcut || shortcut.shortcut
    };
  });

  return updatedShortcuts;
}

export function getShortcut(id: string) {
  return getShortcuts().find((shortcut) => shortcut.id === id);
}

export function getShortcutByTypedId(id: ShortcutId) {
  return getShortcut(id);
}

export function getCurrentShortcut(id: ShortcutId) {
  const shortcut = getShortcutByTypedId(id);
  if (!shortcut) return undefined;
  return shortcut.shortcut;
}

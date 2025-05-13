export interface ShortcutAction {
  id: string; // e.g., "tabs.newTab", "navigation.goBack"
  name: string; // e.g., "Open New Tab", "Go Back"
  shortcut: string; // e.g., "CommandOrControl+T", "Alt+Left"
  category: string; // e.g., "Tabs", "Navigation"
  originalShortcut?: string; // To store the initial default shortcut
}

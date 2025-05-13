import { getAllModifiedShortcuts } from "@/saving/shortcuts";
import { ShortcutAction } from "~/types/shortcuts";

export const shortcuts: ShortcutAction[] = [
  {
    id: "tabs.new",
    name: "New Tab",
    shortcut: "CommandOrControl+T",
    category: "Tabs"
  }
];

export function getShortcuts() {
  const modifiedShortcutsData = getAllModifiedShortcuts();

  const updatedShortcuts = shortcuts.map((shortcut) => {
    const modifiedShortcutData = modifiedShortcutsData.find(({ id }) => id === shortcut.id);
    return {
      ...shortcut,
      originalShortcut: shortcut.shortcut,
      newShortcut: modifiedShortcutData?.newShortcut || shortcut.shortcut
    };
  });

  return updatedShortcuts;
}

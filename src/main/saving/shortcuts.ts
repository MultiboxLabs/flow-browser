import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getDatastore } from "@/saving/datastore";
import { type } from "arktype";

// Modified Shortcut Data //
const ModifiedShortcutData = type({
  newShortcut: "string"
});
type ModifiedShortcutData = typeof ModifiedShortcutData.infer;

// Data Store //
export const ShortcutsDataStore = getDatastore("shortcuts");

// Events //
type ShortcutsEvents = {
  "shortcuts-changed": [];
};
export const shortcutsEmitter = new TypedEventEmitter<ShortcutsEvents>();

// Internal Variables //
const modifiedShortcuts: Map<string, ModifiedShortcutData> = new Map();

// Load Modified Shortcuts //
async function loadShortcuts() {
  const rawModifiedShortcuts = await ShortcutsDataStore.getFullData();

  let hasChanged = false;

  for (const key of Object.keys(rawModifiedShortcuts)) {
    const rawModifiedShortcutData = rawModifiedShortcuts[key];
    const parseResult = ModifiedShortcutData(rawModifiedShortcutData);
    if (!(parseResult instanceof type.errors)) {
      const modifiedShortcutData = parseResult;
      modifiedShortcuts.set(key, modifiedShortcutData);
      hasChanged = true;
    } else {
      console.error(`Invalid shortcut data for ${key}:`, parseResult.toString());
    }
  }

  if (hasChanged) {
    shortcutsEmitter.emit("shortcuts-changed");
  }
}

loadShortcuts();

// Update Modified Shortcuts //
export async function updateModifiedShortcut(id: string, rawModifiedShortcutData: ModifiedShortcutData | unknown) {
  const parseResult = ModifiedShortcutData(rawModifiedShortcutData);
  if (parseResult instanceof type.errors) {
    return false;
  }

  const modifiedShortcutData = parseResult;

  const success = await ShortcutsDataStore.set(id, modifiedShortcutData)
    .then(() => true)
    .catch(() => false);

  if (!success) {
    return false;
  }

  modifiedShortcuts.set(id, modifiedShortcutData);
  shortcutsEmitter.emit("shortcuts-changed");
  return true;
}

// Reset Modified Shortcut //
export async function resetModifiedShortcut(id: string) {
  if (!modifiedShortcuts.has(id)) {
    return false;
  }

  const removed = await ShortcutsDataStore.remove(id)
    .then((removed) => removed)
    .catch(() => false);
  if (!removed) {
    return false;
  }

  modifiedShortcuts.delete(id);
  shortcutsEmitter.emit("shortcuts-changed");
  return true;
}

// Reset All Modified Shortcuts //
export async function resetAllModifiedShortcuts() {
  const wiped = await ShortcutsDataStore.wipe();
  if (!wiped) {
    return false;
  }

  modifiedShortcuts.clear();
  shortcutsEmitter.emit("shortcuts-changed");
  return true;
}

// Get Modified Shortcut //
export function getModifiedShortcut(id: string) {
  return modifiedShortcuts.get(id);
}

// Get All Modified Shortcuts //
export function getAllModifiedShortcuts() {
  return Array.from(modifiedShortcuts.entries()).map(([id, modifiedShortcutData]) => ({
    id,
    ...modifiedShortcutData
  }));
}

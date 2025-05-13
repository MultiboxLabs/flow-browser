import { useCallback } from "react";

// Key code constants for better maintainability
const MODIFIER_KEYS = {
  META: ["MetaLeft", "MetaRight"],
  CONTROL: ["ControlLeft", "ControlRight"],
  SHIFT: ["ShiftLeft", "ShiftRight"],
  ALT: ["AltLeft", "AltRight"]
} as const;

// Special keys that should be handled differently
const SPECIAL_KEYS = {
  ESCAPE: "Escape",
  ENTER: "Enter",
  SPACE: "Space"
} as const;

// Keys that should be preserved with their full names
const PRESERVED_KEYS = [
  "BracketLeft",
  "BracketRight",
  "Backslash",
  "Comma",
  "Period",
  "Slash",
  "Semicolon",
  "Quote",
  "Minus",
  "Equal",
  "Backquote",
  "Space"
] as const;

// Normalized modifier key names for the final shortcut string
const NORMALIZED_MODIFIERS = {
  COMMAND_CONTROL: "CommandOrControl",
  ALT: "Alt",
  SHIFT: "Shift"
} as const;

// Type definitions for better type safety
type ModifierKeyCode =
  | (typeof MODIFIER_KEYS.META)[number]
  | (typeof MODIFIER_KEYS.CONTROL)[number]
  | (typeof MODIFIER_KEYS.SHIFT)[number]
  | (typeof MODIFIER_KEYS.ALT)[number];
type PreservedKeyCode = (typeof PRESERVED_KEYS)[number];
type ShortcutParts = Array<string>;
type NormalizedKeyName = string;
type ShortcutString = string | null;

// All modifier key codes flattened into a single array for easy checking
const ALL_MODIFIER_KEY_CODES: ModifierKeyCode[] = [
  ...MODIFIER_KEYS.META,
  ...MODIFIER_KEYS.CONTROL,
  ...MODIFIER_KEYS.SHIFT,
  ...MODIFIER_KEYS.ALT
];

// Type guard functions
const isModifierKeyCode = (code: string): code is ModifierKeyCode => {
  return ALL_MODIFIER_KEY_CODES.includes(code as ModifierKeyCode);
};

const isPreservedKeyCode = (code: string): code is PreservedKeyCode => {
  return PRESERVED_KEYS.includes(code as PreservedKeyCode);
};

export function useKeyboardNormalizer() {
  /**
   * Normalizes keyboard code to a consistent format for shortcuts
   * Uses event.code for layout-independent, deterministic results
   */
  const normalizeKeyName = useCallback((code: string): NormalizedKeyName => {
    // Handle Command/Control keys
    if (
      MODIFIER_KEYS.META.includes(code as (typeof MODIFIER_KEYS.META)[number]) ||
      MODIFIER_KEYS.CONTROL.includes(code as (typeof MODIFIER_KEYS.CONTROL)[number])
    ) {
      return NORMALIZED_MODIFIERS.COMMAND_CONTROL;
    }

    // Handle Alt key
    if (code === "AltRight") {
      return NORMALIZED_MODIFIERS.ALT;
    }

    // Handle Arrow keys
    if (code.startsWith("Arrow")) {
      return code;
    }

    // Handle letter keys (KeyA, KeyB, etc.)
    if (code.startsWith("Key")) {
      return code.replace("Key", "");
    }

    // Handle number keys (Digit0, Digit1, etc.)
    if (code.startsWith("Digit")) {
      return code.replace("Digit", "");
    }

    // Handle special preserved keys
    if (isPreservedKeyCode(code)) {
      return code;
    }

    // Default case - return the code unchanged
    return code;
  }, []);

  /**
   * Process a keyboard event into a shortcut string
   */
  const processKeyboardEvent = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): ShortcutString => {
      const { code, metaKey, ctrlKey, altKey, shiftKey } = event;

      // Skip Escape and Enter keys (used for cancellation and confirmation)
      if (code === SPECIAL_KEYS.ESCAPE || code === SPECIAL_KEYS.ENTER) {
        return null;
      }

      const parts: ShortcutParts = [];

      // Check for platform-specific command key
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const commandPressed = metaKey || (isMac && ctrlKey);

      // Add modifier keys to the shortcut parts
      if (commandPressed || ctrlKey) {
        parts.push(NORMALIZED_MODIFIERS.COMMAND_CONTROL);
      }

      if (altKey) {
        parts.push(NORMALIZED_MODIFIERS.ALT);
      }

      // Only add Shift if it's not a standalone modifier key press
      if (shiftKey && !isModifierKeyCode(code)) {
        parts.push(NORMALIZED_MODIFIERS.SHIFT);
      }

      // Add the normalized key if it's not just a modifier
      const normalizedKey = normalizeKeyName(code);
      const isModifierKey = [
        NORMALIZED_MODIFIERS.COMMAND_CONTROL,
        NORMALIZED_MODIFIERS.ALT,
        NORMALIZED_MODIFIERS.SHIFT,
        "Control",
        "Meta"
      ].includes(normalizedKey);

      if (!isModifierKey) {
        parts.push(normalizedKey);
      }

      // Remove any duplicate modifiers
      const uniqueParts = [...new Set(parts)];

      // Return the shortcut string if valid
      if (uniqueParts.length > 0 && !(uniqueParts.length === 1 && isModifierKey)) {
        return uniqueParts.join("+");
      }
      // Handle single non-modifier key press
      else if (uniqueParts.length === 0 && !isModifierKeyCode(code)) {
        return normalizedKey;
      }

      return null;
    },
    [normalizeKeyName]
  );

  return {
    normalizeKeyName,
    processKeyboardEvent
  };
}

import { useCallback } from "react";

export function useKeyboardNormalizer() {
  const normalizeKeyName = useCallback((key: string): string => {
    if (key === "Meta") return "CommandOrControl";
    if (key === "Control") return "CommandOrControl";
    if (key === "AltGraph") return "Alt";
    if (key.startsWith("Arrow")) return key;
    if (key.length === 1 && ((key >= "a" && key <= "z") || (key >= "A" && key <= "Z") || (key >= "0" && key <= "9")))
      return key.toUpperCase();
    if (
      [
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
        "Backquote"
      ].includes(key)
    )
      return key;
    if (key === " ") return "Space";
    return key;
  }, []);

  // Process a keyboard event into a shortcut string
  const processKeyboardEvent = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): string | null => {
      const { key, metaKey, ctrlKey, altKey, shiftKey } = event;

      // Skip Escape (used for cancellation), Enter (used for confirmation)
      if (key === "Escape" || key === "Enter") {
        return null;
      }

      let parts: string[] = [];
      if (metaKey || (navigator.platform.toUpperCase().indexOf("MAC") >= 0 && ctrlKey)) parts.push("CommandOrControl");
      else if (ctrlKey) parts.push("CommandOrControl");
      if (altKey) parts.push("Alt");
      if (shiftKey && !["Shift", "Alt", "Control", "Meta"].includes(key)) parts.push("Shift");

      const normalizedKey = normalizeKeyName(key);
      if (!["Shift", "Alt", "Control", "Meta", "CommandOrControl"].includes(normalizedKey)) {
        parts.push(normalizedKey);
      }

      // Prevent duplicate modifiers
      parts = [...new Set(parts)];

      if (
        parts.length > 0 &&
        !(parts.length === 1 && ["Shift", "Alt", "Control", "Meta", "CommandOrControl"].includes(parts[0]))
      ) {
        return parts.join("+");
      } else if (parts.length === 0 && !["Shift", "Alt", "Control", "Meta"].includes(key)) {
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

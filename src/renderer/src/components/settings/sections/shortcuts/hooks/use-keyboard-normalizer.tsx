import { useCallback } from "react";

export function useKeyboardNormalizer() {
  // Normalize keyboard code to a consistent format for shortcuts
  // Uses event.code for layout-independent, deterministic results
  const normalizeKeyName = useCallback((code: string): string => {
    if (code === "MetaLeft" || code === "MetaRight") return "CommandOrControl";
    if (code === "ControlLeft" || code === "ControlRight") return "CommandOrControl";
    if (code === "AltRight") return "Alt";
    if (code.startsWith("Arrow")) return code;
    if (code.startsWith("Key")) return code.replace("Key", "");
    if (code.startsWith("Digit")) return code.replace("Digit", "");
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
      ].includes(code)
    )
      return code;
    if (code === "Space") return "Space";
    return code;
  }, []);

  // Process a keyboard event into a shortcut string
  const processKeyboardEvent = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): string | null => {
      const { code, metaKey, ctrlKey, altKey, shiftKey } = event;

      // Skip Escape (used for cancellation), Enter (used for confirmation)
      if (code === "Escape" || code === "Enter") {
        return null;
      }

      let parts: string[] = [];
      const commandPressed = metaKey || (navigator.platform.toUpperCase().indexOf("MAC") >= 0 && ctrlKey);
      if (commandPressed) parts.push("CommandOrControl");
      else if (ctrlKey) parts.push("CommandOrControl");
      if (altKey) parts.push("Alt");
      if (
        shiftKey &&
        ![
          "ShiftLeft",
          "ShiftRight",
          "AltLeft",
          "AltRight",
          "ControlLeft",
          "ControlRight",
          "MetaLeft",
          "MetaRight"
        ].includes(code)
      )
        parts.push("Shift");

      const normalizedKey = normalizeKeyName(code);
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
      } else if (
        parts.length === 0 &&
        ![
          "ShiftLeft",
          "ShiftRight",
          "AltLeft",
          "AltRight",
          "ControlLeft",
          "ControlRight",
          "MetaLeft",
          "MetaRight"
        ].includes(code)
      ) {
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

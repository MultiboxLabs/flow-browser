import { contextBridge, ipcRenderer } from "electron";

/**
 * Normalizes newlines in the given text.
 * Based on the WHATWG Infra Standard: https://infra.spec.whatwg.org/#normalize-newlines
 * @param text - The text to normalize.
 * @returns The normalized text.
 */
function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

const MAX_DIALOG_STRING_LENGTH = 100;
/**
 * Optionally truncates a simple dialog string.
 * Per the HTML spec, no UI should be provided to display the elided portion,
 * as that could be exploited to craft deceptive security dialogs.
 * https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#optionally-truncate-a-simple-dialog-string
 * @param s - The dialog string to potentially truncate.
 * @returns Either `s` itself, or a shorter string derived from `s`.
 */
function optionallyTruncate(s: string): string {
  if (s.length <= MAX_DIALOG_STRING_LENGTH) return s;
  return s.slice(0, MAX_DIALOG_STRING_LENGTH);
}

// Patches window.prompt, window.confirm, and window.alert to use custom dialogs
export function tryPatchPrompts() {
  // Validate and sanitize in here as main world cannot be trusted (websites can call globalThis.electronPrompts directly)
  const electronPromptsContainer = {
    prompt: (sourceMessage: string, sourceDefaultValue: string) => {
      const message = optionallyTruncate(normalizeNewlines(String(sourceMessage)));
      const defaultValue = optionallyTruncate(String(sourceDefaultValue));
      return ipcRenderer.sendSync("prompts:prompt", message, defaultValue) as string | null;
    }
  };
  contextBridge.exposeInMainWorld("electronPrompts", electronPromptsContainer);

  // Executes in main world, must be self-contained!
  const mainWorldScript = () => {
    const electronPrompts: typeof electronPromptsContainer = globalThis.electronPrompts;

    const prompt: typeof window.prompt = (rawMessage, rawDefaultValue) => {
      const message = String(rawMessage);
      const defaultValue = rawDefaultValue === undefined ? "" : String(rawDefaultValue);

      const result = electronPrompts.prompt(message, defaultValue);
      return result;
    };
    const confirm: typeof window.confirm = (message) => {
      void message;
      return true;
    };
    const alert: typeof window.alert = (message) => {
      void message;
      return undefined;
    };
    window.prompt = prompt;
    window.confirm = confirm;
    window.alert = alert;

    delete globalThis.electronPrompts;
  };

  contextBridge.executeInMainWorld({
    func: mainWorldScript
  });
}

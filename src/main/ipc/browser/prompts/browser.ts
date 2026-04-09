import { sendMessageToListeners } from "@/ipc/listeners-manager";
import { getActivePromptsForRenderer } from "@/modules/prompts";
import { ipcMain } from "electron";

let activePromptsChangedImmediate: NodeJS.Immediate | null = null;
function cleanupActivePromptsImmediate() {
  if (activePromptsChangedImmediate) {
    clearImmediate(activePromptsChangedImmediate);
    activePromptsChangedImmediate = null;
  }
}
export function activePromptsChanged() {
  if (activePromptsChangedImmediate) return;

  activePromptsChangedImmediate = setImmediate(() => {
    sendMessageToListeners("prompts:on-active-prompts-changed", getActivePromptsForRenderer());
    cleanupActivePromptsImmediate();
  });
}

ipcMain.handle("prompts:get-active-prompts", () => {
  return getActivePromptsForRenderer();
});

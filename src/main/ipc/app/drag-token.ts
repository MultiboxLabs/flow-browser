import { ipcMain } from "electron";
import { randomUUID } from "crypto";

// Generated once per app session. Included in external drag-and-drop payloads
// so that drop targets can reject spoofed drags from websites or other apps.
const SESSION_DRAG_TOKEN = randomUUID();

ipcMain.handle("app:get-drag-token", () => SESSION_DRAG_TOKEN);

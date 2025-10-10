// This is for other controllers to interface with the settings window
import { windowsController } from "@/controllers/windows-controller";

const settingsWindowManager = () => windowsController.settings;

export const settings = {
  show: async () => {
    const window = settingsWindowManager().getSingletonWindow();
    window.show();
  },
  hide: () => {
    const window = settingsWindowManager().getSingletonWindow();
    window.destroy();
  },
  isVisible: () => {
    const window = settingsWindowManager().getExistingSingletonWindow();
    if (!window) return false;
    return window.isVisible();
  },
  toggle: () => {
    if (settings.isVisible()) {
      settings.hide();
    } else {
      settings.show();
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (channel: string, ...args: any[]) => {
    const window = settingsWindowManager().getExistingSingletonWindow();
    if (!window) return;
    window.sendMessage(channel, ...args);
  }
};

import { BrowserWindow, nativeTheme } from "electron";
import { registerWindow, WindowType } from "@/modules/windows";
import { FLAGS } from "@/modules/flags";

let onboardingWindow: BrowserWindow | null = null;

function createOnboardingWindow() {
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    center: true,
    show: false,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      height: 20,
      symbolColor: nativeTheme.shouldUseDarkColors ? "white" : "black",
      color: "rgba(0,0,0,0)"
    },
    roundedCorners: true
  });

  window.loadURL("flow-internal://onboarding/");

  window.on("closed", () => {
    onboardingWindow = null;
  });

  registerWindow(WindowType.ONBOARDING, "onboarding", window);
  onboardingWindow = window;

  if (FLAGS.SHOW_DEBUG_DEVTOOLS) {
    setTimeout(() => {
      window.webContents.openDevTools({
        mode: "detach"
      });
    }, 0);
  }

  return new Promise((resolve) => {
    window.once("ready-to-show", () => {
      resolve(window);
    });
  });
}

export const onboarding = {
  show: async () => {
    if (!onboardingWindow) {
      await createOnboardingWindow();
    }

    if (!onboardingWindow) return;

    onboardingWindow.show();
    onboardingWindow.focus();
  },
  hide: () => {
    if (!onboardingWindow) return;

    onboardingWindow.blur();
    onboardingWindow.hide();
  },
  isVisible: () => {
    if (!onboardingWindow) return false;

    return onboardingWindow.isVisible();
  },
  toggle: () => {
    if (!onboardingWindow) return;

    if (onboardingWindow.isVisible()) {
      onboarding.hide();
    } else {
      onboarding.show();
    }
  }
};

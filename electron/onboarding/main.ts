import { BrowserWindow, nativeTheme } from "electron";
import { registerWindow, WindowType } from "@/modules/windows";

let onboardingWindow: BrowserWindow | null = null;

function createOnboardingWindow() {
  const window = new BrowserWindow({
    width: 800,
    height: 580,
    resizable: false,
    center: true,
    show: false,
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hidden" : "hiddenInset",
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

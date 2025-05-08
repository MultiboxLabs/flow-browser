import { BrowserWindow, nativeTheme } from "electron";
import { registerWindow, WindowType } from "@/modules/windows";
import { FLAGS } from "@/modules/flags";
import { defaultSessionReady } from "@/browser/utility/protocols";
import { debugPrint } from "@/modules/output";

let onboardingWindow: BrowserWindow | null = null;

async function createOnboardingWindow() {
  // wait for the default session to be ready so it can use flow-internal protocol
  await defaultSessionReady;
  debugPrint("INITIALIZATION", "default session ready");

  // create the window
  const window = new BrowserWindow({
    width: 1000,
    height: 700,
    resizable: false,
    center: true,
    show: true,
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
}

export const onboarding = {
  show: async () => {
    if (!onboardingWindow) {
      debugPrint("INITIALIZATION", "onboarding window creating...");
      await createOnboardingWindow();
      debugPrint("INITIALIZATION", "onboarding window created");
    }

    if (!onboardingWindow) return;
    debugPrint("INITIALIZATION", "showing onboarding window");

    onboardingWindow.show();
    onboardingWindow.focus();

    debugPrint("INITIALIZATION", "showed onboarding window");
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
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (channel: string, ...args: any[]) => {
    if (!onboardingWindow) return;

    onboardingWindow.webContents.send(channel, ...args);
  }
};

// This is for other controllers to interface with the onboarding window
import { windowsController } from "@/controllers/windows-controller";

const onboardingWindowManager = () => windowsController.onboarding;

export const onboarding = {
  show: async () => {
    const window = onboardingWindowManager().getSingletonWindow();
    await window.show();
  },
  hide: () => {
    const window = onboardingWindowManager().getSingletonWindow();
    window.destroy();
  },
  isVisible: () => {
    const window = onboardingWindowManager().getExistingSingletonWindow();
    if (!window) return false;
    return window.isVisible();
  },
  toggle: () => {
    if (onboarding.isVisible()) {
      onboarding.hide();
    } else {
      onboarding.show();
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendMessage: (channel: string, ...args: any[]) => {
    const window = onboardingWindowManager().getExistingSingletonWindow();
    if (!window) return;
    window.sendMessage(channel, ...args);
  }
};

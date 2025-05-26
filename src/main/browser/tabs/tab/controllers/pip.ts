import { Tab } from "@/browser/tabs/tab";

// This function must be self-contained: it runs in the actual tab's context
const enterPiP = async function () {
  const videos = Array.from(document.querySelectorAll("video")).filter(
    (video) => !video.paused && !video.ended && video.readyState > 2
  );

  if (videos.length > 0 && document.pictureInPictureElement !== videos[0]) {
    try {
      const video = videos[0];

      await video.requestPictureInPicture();

      const onLeavePiP = () => {
        // little hack to check if they clicked back to tab or closed PiP
        //  when going back to tab, the video will continue playing
        //  when closing PiP, the video will pause
        setTimeout(() => {
          const goBackToTab = !video.paused && !video.ended;
          flow.tabs.disablePictureInPicture(goBackToTab);
        }, 50);
        video.removeEventListener("leavepictureinpicture", onLeavePiP);
      };

      video.addEventListener("leavepictureinpicture", onLeavePiP);
      return true;
    } catch (e) {
      console.error("Failed to enter Picture in Picture mode:", e);
      return false;
    }
  }
  return null;
};

// This function must be self-contained: it runs in the actual tab's context
const exitPiP = function () {
  if (document.pictureInPictureElement) {
    document.exitPictureInPicture();
    return true;
  }
  return false;
};

export class TabPipController {
  private readonly tab: Tab;
  public active: boolean = false;

  constructor(tab: Tab) {
    this.tab = tab;

    // Reset the active state when the webview is attached or detached
    tab.on("webview-attached", () => {
      this.setActive(false);
    });
    tab.on("webview-detached", () => {
      this.setActive(false);
    });
  }

  private setActive(active: boolean) {
    if (this.active === active) {
      return false;
    }

    this.active = active;
    this.tab.emit("pip-active-changed", active);
    return true;
  }

  public async tryEnterPiP() {
    const tab = this.tab;
    const webContents = tab.webview.webContents;
    if (!webContents) {
      return false;
    }

    const enteredPiPPromise = webContents
      .executeJavaScript(`(${enterPiP})()`, true)
      .then((res) => {
        return res === true;
      })
      .catch((err) => {
        console.error("PiP error:", err);
        return false;
      });

    const enteredPiP = await enteredPiPPromise;
    if (enteredPiP) {
      this.setActive(true);
    }

    return enteredPiP;
  }

  public async tryExitPiP() {
    const tab = this.tab;
    const webContents = tab.webview.webContents;
    if (!webContents) {
      return false;
    }

    const exitedPiPPromise = webContents
      .executeJavaScript(`(${exitPiP})()`, true)
      .then((res) => res === true)
      .catch((err) => {
        console.error("PiP error:", err);
        return false;
      });

    const exitedPiP = await exitedPiPPromise;
    if (exitedPiP) {
      this.setActive(false);
    }

    return exitedPiP;
  }
}

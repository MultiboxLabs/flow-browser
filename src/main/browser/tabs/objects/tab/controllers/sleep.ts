import { Tab } from "@/browser/tabs/objects/tab";

export class TabSleepController {
  private readonly tab: Tab;

  public asleep: boolean;

  constructor(tab: Tab) {
    const creationDetails = tab.creationDetails;

    this.tab = tab;

    this.asleep = creationDetails.asleep ?? false;

    tab.on("sleep-changed", () => this.updateWebviewSleep());
    setImmediate(() => this.updateWebviewSleep());
  }

  public putToSleep() {
    if (this.asleep) {
      return false;
    }

    this.asleep = true;
    this.tab.emit("sleep-changed");
    return true;
  }

  public wakeUp() {
    if (!this.asleep) {
      return false;
    }

    this.asleep = false;
    this.tab.emit("sleep-changed");
    return true;
  }

  private updateWebviewSleep() {
    const tab = this.tab;
    const webview = tab.webview;
    if (this.asleep) {
      webview.detach();
    } else {
      webview.attach();
    }
  }
}

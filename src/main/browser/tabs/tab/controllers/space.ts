import { Tab } from "@/browser/tabs/tab";

export class TabSpaceController {
  private readonly tab: Tab;
  private spaceId: string | null = null;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  public get() {
    return this.spaceId;
  }

  public set(spaceId: string) {
    if (this.spaceId === spaceId) {
      return false;
    }

    this.spaceId = spaceId;
    this.tab.emit("space-changed");
    return true;
  }
}

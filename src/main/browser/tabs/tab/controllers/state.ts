import { Tab } from "@/browser/tabs/tab";

export class TabStateController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }
}

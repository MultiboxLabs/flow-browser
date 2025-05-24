import { Tab } from "@/browser/tabs/tab";

export class TabDataController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }
}

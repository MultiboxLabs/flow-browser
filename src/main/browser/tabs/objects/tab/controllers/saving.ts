import { Tab } from "@/browser/tabs/objects/tab";

export class TabSavingController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }
}

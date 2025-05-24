import { Tab } from "@/browser/tabs/tab";

export class TabSavingController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }
}

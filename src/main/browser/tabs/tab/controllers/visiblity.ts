import { Tab } from "@/browser/tabs/tab";

export class TabVisiblityController {
  private readonly tab: Tab;

  constructor(tab: Tab) {
    this.tab = tab;
  }
}

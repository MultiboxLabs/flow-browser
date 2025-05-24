import { Tab } from "@/browser/tabs/tab";

export class TabStateController {
  private readonly tab: Tab;

  public asleep: boolean;

  constructor(tab: Tab) {
    const creationDetails = tab.creationDetails;

    this.tab = tab;

    this.asleep = creationDetails.asleep ?? false;
  }
}

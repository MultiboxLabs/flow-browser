import { TabGroup } from "@/browser/tabs/objects/tab-group";

export class TabGroupSpaceController {
  private readonly tabGroup: TabGroup;
  private space: string;

  constructor(tabGroup: TabGroup) {
    this.tabGroup = tabGroup;

    const creationDetails = tabGroup.creationDetails;
    this.space = creationDetails.space;
  }

  public get() {
    return this.space;
  }

  public set(space: string) {
    if (this.space === space) {
      return false;
    }

    this.space = space;
    this.tabGroup.emit("space-changed");

    return true;
  }
}

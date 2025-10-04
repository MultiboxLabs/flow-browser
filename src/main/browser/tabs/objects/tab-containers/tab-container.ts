import { BaseTabContainer, BaseTabContainerEvents, ExportedTabContainer, TabContainerSharedData } from "./base";

type TabContainerEvents = BaseTabContainerEvents & {
  "space-changed": [spaceId: string];
};

export class TabContainer extends BaseTabContainer<TabContainerEvents> {
  public spaceId: string;

  constructor(spaceId: string, sharedData: TabContainerSharedData) {
    super(sharedData);
    this.spaceId = spaceId;
  }

  public setSpace(spaceId: string): void {
    this.spaceId = spaceId;
    this.emit("space-changed", spaceId);
  }

  public export(): ExportedTabContainer {
    const { children } = this.baseExport();
    return {
      type: "tab-container",
      children
    };
  }
}

import { BaseTabContainer, BaseTabContainerEvents, ExportedTabContainer } from "./base";

type TabContainerEvents = BaseTabContainerEvents & {
  "space-changed": [spaceId: string];
};

export class TabContainer extends BaseTabContainer<TabContainerEvents> {
  public spaceId: string;

  constructor(spaceId: string) {
    super();
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

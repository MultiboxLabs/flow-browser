import { BaseTabContainer, ExportedTabsFolder } from "./base";

export class TabFolder extends BaseTabContainer {
  public name: string;
  public parent: BaseTabContainer;

  constructor(name: string, parent: BaseTabContainer) {
    super(parent.sharedData);
    this.name = name;
    this.parent = parent;
  }

  public setName(name: string): void {
    this.name = name;
  }

  public export(): ExportedTabsFolder {
    const { children } = this.baseExport();
    return {
      type: "tab-folder",
      name: this.name,
      children
    };
  }
}

import { BaseTabContainer, ExportedTabsFolder } from "./base";

export class TabFolder extends BaseTabContainer {
  public name: string;

  constructor(name: string) {
    super();
    this.name = name;
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

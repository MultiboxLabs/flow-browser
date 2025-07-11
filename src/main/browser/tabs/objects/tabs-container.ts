import { TabGroup } from "@/browser/tabs/objects/tab-group";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";

// Container Child //
type TabGroupChild = {
  type: "tab-group";
  item: TabGroup;
};
type TabContainerChild = {
  type: "tab-container";
  item: TabsContainer;
};
export type ContainerChild = TabGroupChild | TabContainerChild;

// Exported Tab Data //
export type ExportedTabGroup = {
  type: "tab-group";
};
export type ExportedTabsContainer = {
  type: "tabs-container";
  name: string;
  children: ExportedTabData[];
};
type ExportedTabData = ExportedTabGroup | ExportedTabsContainer;

// Tabs Container //
type TabsContainerEvents = {
  "child-added": [child: ContainerChild];
  "child-removed": [child: ContainerChild];
  "children-moved": [];
};

export class TabsContainer extends TypedEventEmitter<TabsContainerEvents> {
  public name: string;
  public children: ContainerChild[];

  constructor(name: string) {
    super();

    this.name = name;
    this.children = [];
  }

  public addChild(child: ContainerChild): void {
    this.children.push(child);
    this.emit("child-added", child);
  }

  public removeChild(child: ContainerChild): boolean {
    const index = this.children.indexOf(child);
    if (index === -1) return false;

    this.children.splice(index, 1);
    this.emit("child-removed", child);
    return true;
  }

  public moveChild(from: number, to: number): boolean {
    if (from < 0 || from >= this.children.length || to < 0 || to >= this.children.length) {
      return false;
    }

    const [child] = this.children.splice(from, 1);
    this.children.splice(to, 0, child);
    this.emit("children-moved");
    return true;
  }

  public findChildrenByType(type: "tab-group" | "tab-container"): ContainerChild[] {
    return this.children.filter((child) => child.type === type);
  }

  public getChildIndex(child: ContainerChild): number {
    return this.children.indexOf(child);
  }

  get childCount(): number {
    return this.children.length;
  }

  public export(): ExportedTabsContainer {
    return {
      type: "tabs-container",
      name: this.name,
      children: this.children.map((child) => {
        return child.item.export();
      })
    };
  }
}

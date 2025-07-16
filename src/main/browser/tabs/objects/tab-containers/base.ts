import { TabGroup } from "@/browser/tabs/objects/tab-group";
import { TabFolder } from "@/browser/tabs/objects/tab-containers/tab-folder";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";

// Container Child //
type TabGroupChild = {
  type: "tab-group";
  item: TabGroup;
};
type TabFolderChild = {
  type: "tab-folder";
  item: TabFolder;
};
export type ContainerChild = TabGroupChild | TabFolderChild;

// Exported Tab Data //
export type ExportedBaseTabContainer = {
  type: "tab-container";
  children: ExportedTabData[];
};

export type ExportedTabGroup = {
  type: "tab-group";
};
export type ExportedTabContainer = {
  type: "tab-container";
  children: ExportedTabData[];
};
export type ExportedTabsFolder = {
  type: "tab-folder";
  name: string;
  children: ExportedTabData[];
};
// ExportedTabContainer would not be a child: it should only be the root container.
type ExportedTabData = ExportedTabGroup | ExportedTabsFolder;

// Base Tab Container //
export type BaseTabContainerEvents = {
  "child-added": [child: ContainerChild];
  "child-removed": [child: ContainerChild];
  "children-moved": [];
};

export class BaseTabContainer<
  TEvents extends BaseTabContainerEvents = BaseTabContainerEvents
> extends TypedEventEmitter<TEvents> {
  public children: ContainerChild[];

  constructor() {
    super();

    this.children = [];
  }

  public getAllTabGroups(): TabGroup[] {
    const scanTabContainer = (container: BaseTabContainer): TabGroup[] => {
      return container.children.flatMap((child) => {
        if (child.type === "tab-group") {
          return [child.item];
        }
        if (child.type === "tab-folder") {
          return scanTabContainer(child.item);
        }
        return [];
      });
    };

    return scanTabContainer(this);
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

  protected baseExport(): ExportedBaseTabContainer {
    return {
      type: "tab-container",
      children: this.children.map((child) => {
        return child.item.export();
      })
    };
  }
}

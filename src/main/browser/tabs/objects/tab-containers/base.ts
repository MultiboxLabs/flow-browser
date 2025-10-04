import { TabGroup } from "@/browser/tabs/objects/tab-group";
import { TabFolder } from "@/browser/tabs/objects/tab-containers/tab-folder";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { NormalTabGroup } from "@/browser/tabs/objects/tab-group/types/normal";
import { TabbedBrowserWindow } from "@/browser/window";
import { Browser } from "@/browser/browser";

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

// Tab Container Shared Data //
export interface TabContainerSharedData {
  browser: Browser;
  window: TabbedBrowserWindow;
  space: string;
}

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

  public sharedData: TabContainerSharedData;

  constructor(sharedData: TabContainerSharedData) {
    super();

    this.children = [];
    this.sharedData = sharedData;
  }

  // Modify Children //

  /**
   * Add a child to the container.
   * @param child - The child to add.
   */
  private addChild(child: ContainerChild): void {
    this.children.push(child);
    this.emit("child-added", child);
  }

  /**
   * Remove a child from the container.
   * @param child - The child to remove.
   * @returns Whether the child was removed.
   */
  private removeChild(child: ContainerChild): boolean {
    const index = this.children.indexOf(child);
    if (index === -1) return false;

    this.children.splice(index, 1);
    this.emit("child-removed", child);
    return true;
  }

  /**
   * Move a child to a new index.
   * @param from - The index to move from.
   * @param to - The index to move to.
   * @returns Whether the child was moved.
   */
  public moveChild(from: number, to: number): boolean {
    if (from < 0 || from >= this.children.length || to < 0 || to >= this.children.length) {
      return false;
    }

    const [child] = this.children.splice(from, 1);
    this.children.splice(to, 0, child);
    this.emit("children-moved");
    return true;
  }

  // Get Children //

  public findChildrenByType(type: "tab-group" | "tab-container"): ContainerChild[] {
    return this.children.filter((child) => child.type === type);
  }

  public getChildIndex(child: ContainerChild): number {
    return this.children.indexOf(child);
  }

  get childCount(): number {
    return this.children.length;
  }

  // New Children //

  public newTabFolder(name: string): TabFolder {
    const folder = new TabFolder(name, this);
    this.addChild({ type: "tab-folder", item: folder });
    return folder;
  }

  public newNormalTabGroup(): NormalTabGroup {
    const tabGroup = new NormalTabGroup({
      browser: this.sharedData.browser,
      window: this.sharedData.window,
      space: this.sharedData.space
    });
    this.addChild({ type: "tab-group", item: tabGroup });
    return tabGroup;
  }

  // Others //

  /**
   * Get all tab groups in the container.
   * @returns All tab groups in the container.
   */
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

  // Export //

  protected baseExport(): ExportedBaseTabContainer {
    return {
      type: "tab-container",
      children: this.children.map((child) => {
        return child.item.export();
      })
    };
  }
}

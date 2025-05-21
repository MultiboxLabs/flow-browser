import { TabGroup } from "../tab-groups";
import { TabManager } from "../tab-manager";
import { TypedEventEmitter } from "../../../modules/typed-event-emitter";
import { TabFolderData } from "../../../../shared/types/tabs";

type TabFolderEvents = {
  "tabgroup-added": [number];
  "tabgroup-removed": [number];
  "expanded-changed": [boolean];
  "name-changed": [string];
  "position-changed": [number];
  destroyed: [];
};

/**
 * TabFolder class for organizing tab groups
 */
export class TabFolder extends TypedEventEmitter<TabFolderEvents> {
  public id: string;
  public name: string;
  public profileId: string;
  public spaceId: string;
  public tabGroupIds: Set<number> = new Set();
  public position: number;
  public expanded: boolean;
  public isDestroyed: boolean = false;

  private tabManager: TabManager;

  /**
   * Creates a new tab folder
   */
  constructor(
    tabManager: TabManager,
    id: string,
    name: string,
    profileId: string,
    spaceId: string,
    position: number,
    expanded: boolean = true
  ) {
    super();
    this.tabManager = tabManager;
    this.id = id;
    this.name = name;
    this.profileId = profileId;
    this.spaceId = spaceId;
    this.position = position;
    this.expanded = expanded;

    this.on("tabgroup-added", () => this.saveFolder());
    this.on("tabgroup-removed", () => this.saveFolder());
    this.on("expanded-changed", () => this.saveFolder());
    this.on("name-changed", () => this.saveFolder());
    this.on("position-changed", () => this.saveFolder());
  }

  /**
   * Add a tab group to this folder
   */
  public addTabGroup(tabGroupId: number): boolean {
    const tabGroup = this.tabManager.getTabGroupById(tabGroupId);
    if (!tabGroup) return false;

    if (this.tabGroupIds.has(tabGroupId)) return true;

    if (tabGroup.profileId !== this.profileId || tabGroup.spaceId !== this.spaceId) {
      return false;
    }

    this.tabGroupIds.add(tabGroupId);
    this.emit("tabgroup-added", tabGroupId);
    return true;
  }

  /**
   * Remove a tab group from this folder
   */
  public removeTabGroup(tabGroupId: number): boolean {
    if (!this.tabGroupIds.has(tabGroupId)) return false;

    this.tabGroupIds.delete(tabGroupId);
    this.emit("tabgroup-removed", tabGroupId);
    return true;
  }

  /**
   * Get all tab groups in this folder
   */
  public getTabGroups(): TabGroup[] {
    const result: TabGroup[] = [];
    for (const tabGroupId of this.tabGroupIds) {
      const tabGroup = this.tabManager.getTabGroupById(tabGroupId);
      if (tabGroup) {
        result.push(tabGroup);
      }
    }
    return result;
  }

  /**
   * Save folder to persistent storage
   */
  public async saveFolder() {
    if (this.isDestroyed) return;

    try {
      await this.tabManager.persistTabFolder(this);
    } catch (error) {
      console.error(`Error saving tab folder ${this.id}:`, error);
    }
  }

  /**
   * Set folder expanded state
   */
  public setExpanded(expanded: boolean) {
    if (this.expanded === expanded) return;

    this.expanded = expanded;
    this.emit("expanded-changed", expanded);
  }

  /**
   * Set folder name
   */
  public setName(name: string) {
    if (this.name === name) return;

    this.name = name;
    this.emit("name-changed", name);
  }

  /**
   * Set folder position
   */
  public setPosition(position: number) {
    if (this.position === position) return;

    this.position = position;
    this.emit("position-changed", position);
  }

  /**
   * Get folder data
   */
  public getData(): TabFolderData {
    return {
      id: this.id,
      name: this.name,
      profileId: this.profileId,
      spaceId: this.spaceId,
      tabGroupIds: Array.from(this.tabGroupIds),
      position: this.position,
      expanded: this.expanded
    };
  }

  /**
   * Destroy the folder
   */
  public destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    this.emit("destroyed");
    this.destroyEmitter();

    this.tabGroupIds.clear();
  }
}

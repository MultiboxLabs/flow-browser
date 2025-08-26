import { Browser } from "@/browser/browser";
import { TabContainer } from "@/browser/tabs/objects/tab-containers/tab-container";
import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { getSpacesFromProfile, SpaceData, spacesEmitter } from "@/sessions/spaces";

type TabsContainerManagerEvents = {
  destroyed: [];
};

/**
 * Manages tab containers for browser profiles and spaces
 * @class
 * @extends TypedEventEmitter<TabsContainerManagerEvents>
 */
export class TabsContainerManager extends TypedEventEmitter<TabsContainerManagerEvents> {
  public isDestroyed: boolean = false;

  private readonly browser: Browser;

  constructor(browser: Browser) {
    super();
    this.browser = browser;

    const tabOrchestrator = browser.tabs;
    tabOrchestrator.tabManager.on("tab-created", (tab) => {
      console.log("tab-created", tab);
    });

    // Setup tab containers for all loaded profiles & all new loaded profiles
    const loadedProfiles = browser.getLoadedProfiles();
    for (const profile of loadedProfiles) {
      this._setupProfile(profile.profileId);
    }

    browser.on("profile-loaded", (profileId) => {
      this._setupProfile(profileId);
    });
  }

  /**
   * Sets up tab containers for a specific profile
   * @private
   * @param {string} profileId - The ID of the profile to set up
   * @returns {Promise<void>}
   */
  private async _setupProfile(profileId: string): Promise<void> {
    const spacesSet = new Set<string>();

    const updateSpaces = async () => {
      const spaces = await getSpacesFromProfile(profileId);
      for (const space of spaces) {
        if (!spacesSet.has(space.id)) {
          this._setupSpace(space);
          spacesSet.add(space.id);
        }
      }
    };

    updateSpaces();
    spacesEmitter.on("changed", updateSpaces);

    const favouritesContainer = new TabContainer(spaces[0]?.id ?? "");
  }

  /**
   * Sets up tab containers for a specific space
   * Creates both pinned and normal containers for organizing tabs
   * @private
   * @param {SpaceData & { id: string }} space - The space data including its ID
   */
  private _setupSpace(space: SpaceData & { id: string }): void {
    const normalContainer = new TabContainer(space.id);

    // Add tab group to the correct container on create
    const browser = this.browser;
    const tabOrchestrator = browser.tabs;
    tabOrchestrator.tabGroupManager.on("tab-group-created", (tabGroup) => {
      normalContainer.addChild({
        type: "tab-group",
        item: tabGroup
      });
    });
  }

  /**
   * Destroys the tabs container manager and cleans up resources
   * Emits the 'destroyed' event and prevents further destruction attempts
   * @public
   * @returns {void}
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.emit("destroyed");

    this.destroyEmitter();
  }
}

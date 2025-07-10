import { TabGroup, TabGroupCreationDetails } from "../index";

/**
 * A tab group that can only have one tab.
 */
export class NormalTabGroup extends TabGroup {
  constructor(details: TabGroupCreationDetails) {
    super({ type: "normal", maxTabs: 1 }, details);
  }
}

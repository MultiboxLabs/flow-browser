import { BaseTabGroup } from "./index";

export class SplitTabGroup extends BaseTabGroup {
  public mode: "split" = "split" as const;

  constructor(...args: ConstructorParameters<typeof BaseTabGroup>) {
    super(...args);

    this.on("tab-removed", () => {
      if (this.tabs.length < 2) {
        this.destroy();
      }
    });
  }

  // TODO: Implement split tab group layout
}

import { TypedEventEmitter } from "@/modules/typed-event-emitter";
import { generateID } from "@/modules/utils";
import { PersistedPinnedTabData } from "~/types/tab-service";
import type { TabLayoutNode } from "./tab-layout-node";

/**
 * PinnedTab — a persistent URL shortcut tied to a profile.
 *
 * Core component of the TabService. Each pinned tab can have one
 * associated live tab per space, allowing each space to have its own
 * instance of the pinned URL.
 *
 * Future: Bookmarks will follow the same pattern — a persisted entity
 * that opens as itself (not as a new tab).
 */

type PinnedTabEvents = {
  "association-changed": [];
  updated: [];
  destroyed: [];
};

export class PinnedTab extends TypedEventEmitter<PinnedTabEvents> {
  public readonly uniqueId: string;
  public readonly profileId: string;
  public defaultUrl: string;
  public faviconUrl: string | null;
  public position: number;

  /** Runtime: spaceId -> associated tab ID */
  private _associations: Map<string, number> = new Map();

  /** Runtime: the shared layout node for this pinned tab (exists in all profile layouts). */
  public layoutNode: TabLayoutNode | null = null;

  constructor(data: PersistedPinnedTabData) {
    super();

    this.uniqueId = data.uniqueId;
    this.profileId = data.profileId;
    this.defaultUrl = data.defaultUrl;
    this.faviconUrl = data.faviconUrl;
    this.position = data.position;
  }

  // --- Factory ---

  public static create(profileId: string, defaultUrl: string, faviconUrl: string | null, position: number): PinnedTab {
    return new PinnedTab({
      uniqueId: generateID(),
      profileId,
      defaultUrl,
      faviconUrl,
      position
    });
  }

  // --- Associations ---

  public get associations(): ReadonlyMap<string, number> {
    return this._associations;
  }

  public getAssociatedTabId(spaceId: string): number | null {
    return this._associations.get(spaceId) ?? null;
  }

  public getAssociatedTabIds(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [spaceId, tabId] of this._associations) {
      result[spaceId] = tabId;
    }
    return result;
  }

  public associate(spaceId: string, tabId: number): void {
    this._associations.set(spaceId, tabId);
    this.emit("association-changed");
  }

  public dissociate(spaceId: string): void {
    if (this._associations.has(spaceId)) {
      this._associations.delete(spaceId);
      this.emit("association-changed");
    }
  }

  public dissociateByTabId(tabId: number): boolean {
    let changed = false;

    for (const [spaceId, associatedTabId] of this._associations) {
      if (associatedTabId === tabId) {
        this._associations.delete(spaceId);
        changed = true;
      }
    }

    if (changed) {
      this.emit("association-changed");
    }
    return changed;
  }

  public hasAssociation(tabId: number): boolean {
    for (const associatedTabId of this._associations.values()) {
      if (associatedTabId === tabId) return true;
    }
    return false;
  }

  // --- Updates ---

  public updateFavicon(faviconUrl: string | null): void {
    if (this.faviconUrl === faviconUrl) return;
    this.faviconUrl = faviconUrl;
    this.emit("updated");
  }

  public updatePosition(position: number): void {
    if (this.position === position) return;
    this.position = position;
    this.emit("updated");
  }

  // --- Serialization ---

  public toPersistedData(): PersistedPinnedTabData {
    return {
      uniqueId: this.uniqueId,
      profileId: this.profileId,
      defaultUrl: this.defaultUrl,
      faviconUrl: this.faviconUrl,
      position: this.position
    };
  }

  // --- Lifecycle ---

  public destroy(): void {
    this._associations.clear();
    this.emit("destroyed");
    this.destroyEmitter();
  }
}

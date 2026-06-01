import type { DiscoveryRecord, AppMeta } from "../types/discovery";

// The persistence contract. All methods are async so the current
// localStorage implementation can later be swapped for an IndexedDB one
// (needed once the photo-scan feature stores image blobs) with zero changes
// to the UI/hooks that consume this interface.
export interface PlantdexStore {
  getDiscoveries(): Promise<DiscoveryRecord[]>;
  isDiscovered(plantId: string): Promise<boolean>;
  /** Upsert by plantId (first discovery wins for dateSeen). */
  discover(rec: DiscoveryRecord): Promise<void>;
  undiscover(plantId: string): Promise<void>;

  getMeta(): Promise<AppMeta>;
  setMeta(patch: Partial<AppMeta>): Promise<void>;

  clear(): Promise<void>;

  // ---- FUTURE (photo scan, IndexedDB impl only) ----
  savePhoto?(blob: Blob): Promise<string>;
  getPhoto?(ref: string): Promise<Blob | undefined>;
}

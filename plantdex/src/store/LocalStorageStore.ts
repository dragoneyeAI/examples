import type { PlantdexStore } from "./PlantdexStore";
import type { DiscoveryRecord, AppMeta } from "../types/discovery";
import { EMPTY_META } from "../types/discovery";

// localStorage-backed store. Persists the discovery list + lightweight app
// meta under a single versioned key so a future migration is straightforward.
// Photo blobs are intentionally NOT stored here (that's the future IndexedDB
// impl's job) — this keeps us well under localStorage's ~5MB ceiling.

const KEY = "plantdex:v1";

interface Persisted {
  discoveries: DiscoveryRecord[];
  meta: AppMeta;
}

function read(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { discoveries: [], meta: { ...EMPTY_META } };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      discoveries: parsed.discoveries ?? [],
      meta: { ...EMPTY_META, ...parsed.meta },
    };
  } catch {
    return { discoveries: [], meta: { ...EMPTY_META } };
  }
}

function write(state: Persisted): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota / private mode — fail silently; the app still works in-session */
  }
}

export class LocalStorageStore implements PlantdexStore {
  async getDiscoveries(): Promise<DiscoveryRecord[]> {
    return read().discoveries;
  }

  async isDiscovered(plantId: string): Promise<boolean> {
    return read().discoveries.some((d) => d.plantId === plantId);
  }

  async discover(rec: DiscoveryRecord): Promise<void> {
    const state = read();
    if (state.discoveries.some((d) => d.plantId === rec.plantId)) return; // first wins
    state.discoveries.push(rec);
    write(state);
  }

  async undiscover(plantId: string): Promise<void> {
    const state = read();
    state.discoveries = state.discoveries.filter((d) => d.plantId !== plantId);
    write(state);
  }

  async getMeta(): Promise<AppMeta> {
    return read().meta;
  }

  async setMeta(patch: Partial<AppMeta>): Promise<void> {
    const state = read();
    state.meta = { ...state.meta, ...patch };
    write(state);
  }

  async clear(): Promise<void> {
    write({ discoveries: [], meta: { ...EMPTY_META } });
  }
}

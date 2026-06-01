import type { Plant, PlantDataset, PlantType, Habitat } from "../types/plant";
import dataset from "../../data/plants.json";

const DATA = dataset as unknown as PlantDataset;

/** All plants, sorted by dex number. */
export const PLANTS: Plant[] = [...DATA.plants].sort(
  (a, b) => a.dexNumber - b.dexNumber,
);

export const PLANT_COUNT = PLANTS.length;
export const DATASET_VERSION = DATA.schemaVersion;

const BY_ID = new Map<string, Plant>(PLANTS.map((p) => [p.id, p]));

export function getPlant(id: string): Plant | undefined {
  return BY_ID.get(id);
}

/** All distinct types present in the dataset (for filter chips). */
export const ALL_TYPES: PlantType[] = Array.from(
  new Set(PLANTS.flatMap((p) => p.types)),
);

export const ALL_HABITATS: Habitat[] = Array.from(
  new Set(PLANTS.flatMap((p) => p.habitat)),
);

/** Deterministic "plant of the day" — same all day, no server.
 *  Seeds a simple index from the YYYY-MM-DD string so it rotates daily. */
export function plantOfTheDay(isoDate: string): Plant {
  let hash = 0;
  for (let i = 0; i < isoDate.length; i++) {
    hash = (hash * 31 + isoDate.charCodeAt(i)) >>> 0;
  }
  return PLANTS[hash % PLANTS.length];
}

/** Plants blooming in a given 1–12 month (for the seasonal NYC highlight). */
export function bloomingIn(month: number): Plant[] {
  return PLANTS.filter((p) => p.bloomMonths?.includes(month));
}

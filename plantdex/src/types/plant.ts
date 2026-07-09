// The plant data model. This shape is the contract between the offline
// build pipeline (scripts/build-data) and the runtime app. It is validated
// at build time against data/plants.schema.json.

/** Pokédex-style "types" — drive color theming and filtering. */
export type PlantType =
  | "tree"
  | "flower"
  | "herb"
  | "houseplant"
  | "succulent"
  | "cactus"
  | "fern"
  | "shrub"
  | "vine";

/** Where you'd encounter the plant around NYC. */
export type Habitat = "indoor" | "street" | "park";

/** Six 0–100 stats rendered as Pokédex stat bars. */
export interface PlantStats {
  light: number;
  water: number;
  humidity: number;
  difficulty: number;
  growthRate: number;
  toxicity: number;
}

/** Human-readable care info shown as chips. */
export interface PlantCare {
  light: string;
  watering: string;
  temperatureC?: [number, number];
  humidity?: string;
  petSafe?: boolean;
}

/** Image attribution — mandatory for Wikimedia Commons images. */
export interface ImageAttribution {
  license: string;
  licenseUrl?: string;
  author?: string;
  sourceUrl?: string;
  title?: string;
}

export interface PlantImage {
  url: string;
  thumbUrl: string;
  attribution: ImageAttribution;
}

/** Bridge to a future server prediction: lets us map a Dragoneye taxon
 *  (displayName / scientific name) back to a Plant.id. */
export interface TaxonRef {
  wikidataId?: string;
  scientificName: string;
  aliases: string[];
}

export interface Plant {
  id: string;
  dexNumber: number;
  commonName: string;
  latinName: string;
  family?: string;
  types: PlantType[];
  habitat: Habitat[];
  flavorText: string;
  stats: PlantStats;
  care: PlantCare;
  /** 1–12 months the plant typically blooms (powers the Home seasonal highlight). */
  bloomMonths?: number[];
  image: PlantImage;
  taxonRef: TaxonRef;
}

export interface PlantDataset {
  schemaVersion: number;
  generatedAt: string;
  plantCount: number;
  plants: Plant[];
}

export const STAT_KEYS: (keyof PlantStats)[] = [
  "light",
  "water",
  "humidity",
  "difficulty",
  "growthRate",
  "toxicity",
];

export const STAT_LABELS: Record<keyof PlantStats, string> = {
  light: "Light",
  water: "Water",
  humidity: "Humidity",
  difficulty: "Difficulty",
  growthRate: "Growth",
  toxicity: "Toxicity",
};

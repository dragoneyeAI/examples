import type {
  PlantType,
  Habitat,
  PlantCare,
  PlantStats,
} from "../../src/types/plant";

/** A hand-curated seed entry. The pipeline enriches it with image, flavor
 *  text, and Wikidata id, and derives any missing stats. */
export interface SeedPlant {
  id: string;
  commonName: string;
  latinName: string;
  /** Wikipedia page title to look up; defaults to latinName. */
  wikipediaTitle?: string;
  family?: string;
  types: PlantType[];
  habitat: Habitat[];
  bloomMonths?: number[];
  care: PlantCare;
  /** Extra search aliases (common misspellings, alt names). */
  aliases?: string[];
  /** Optional explicit stat overrides; anything omitted is derived. */
  stats?: Partial<PlantStats>;
}

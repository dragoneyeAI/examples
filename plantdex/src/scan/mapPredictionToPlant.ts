import type { Plant } from "../types/plant";
import type {
  ImagePredictionResult,
  PredictedCategory,
} from "./predictionTypes";

export interface PlantMatch {
  plant: Plant;
  /** The category score that produced the match (0–1). */
  confidence: number;
  /** The prediction label we matched on (for debugging/UI). */
  matchedOn: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[×]/g, "x").replace(/\s+/g, " ").trim();
}

/** Flatten every object's category predictions into a single ranked list. */
export function collectCategories(
  result: ImagePredictionResult,
): PredictedCategory[] {
  return (result.object_predictions ?? [])
    .flatMap((obj) => obj.predictions ?? [])
    .map((p) => p.category)
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);
}

/** Build a lookup from every searchable name → plant. */
function buildIndex(plants: Plant[]): Map<string, Plant> {
  const idx = new Map<string, Plant>();
  for (const p of plants) {
    const keys = [
      p.commonName,
      p.latinName,
      p.taxonRef.scientificName,
      ...p.taxonRef.aliases,
    ];
    for (const k of keys) {
      const n = normalize(k);
      if (!idx.has(n)) idx.set(n, p);
    }
  }
  return idx;
}

/**
 * Maps a Dragoneye image-classification result to a Plantdex entry. The custom
 * `plantdex` model's categories ARE our plants (keyed off `commonName`), so the
 * happy path is an exact name match; we keep a substring fallback for robustness
 * against alias/scientific-name variation. Candidate categories are ranked by
 * score (highest first) so the most confident prediction wins.
 *
 * Pure and dependency-free so it's trivially unit-testable and reusable.
 */
export function mapPredictionToPlant(
  result: ImagePredictionResult,
  plants: Plant[],
): PlantMatch | null {
  const idx = buildIndex(plants);
  const candidates = collectCategories(result);

  // 1) exact name match
  for (const c of candidates) {
    const hit = idx.get(normalize(c.name));
    if (hit) return { plant: hit, confidence: c.score, matchedOn: c.name };
  }

  // 2) fuzzy: a plant key contained in the category name or vice-versa
  for (const c of candidates) {
    const n = normalize(c.name);
    for (const [key, plant] of idx) {
      if (key.length >= 4 && (n.includes(key) || key.includes(n))) {
        return { plant, confidence: c.score, matchedOn: c.name };
      }
    }
  }

  return null;
}

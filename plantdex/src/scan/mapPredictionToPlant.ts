import type { Plant } from "../types/plant";
import type { ScanResult, CategoryPrediction } from "./predictionTypes";

export interface PlantMatch {
  plant: Plant;
  /** Best single-detection score for the winning plant (0–1), for the UI. */
  confidence: number;
  /** The prediction label we matched on (for debugging/UI). */
  matchedOn: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[×]/g, "x").replace(/\s+/g, " ").trim();
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

/** Resolve a single category label to a plant — exact name first, then a
 *  length-guarded substring match either direction. */
function resolvePlant(
  name: string,
  idx: Map<string, Plant>,
): Plant | null {
  const n = normalize(name);
  const exact = idx.get(n);
  if (exact) return exact;
  for (const [key, plant] of idx) {
    if (key.length >= 4 && (n.includes(key) || key.includes(n))) return plant;
  }
  return null;
}

/**
 * Maps a Dragoneye scan result to a Plantdex entry.
 *
 * A photo of one plant routinely yields many detected objects (the model boxes
 * individual leaves/regions), so trusting the single highest-scoring category
 * is fragile — a stray high-confidence misfire can outrank the true subject. We
 * instead tally score-weighted votes: every category prediction is resolved to
 * a plant and its score added to that plant's total, and the plant with the
 * greatest total confidence mass wins. Reported `confidence` is that plant's
 * best single detection (a sensible "N% match"); `matchedOn` is the label of
 * that detection.
 *
 * Pure and dependency-free so it's trivially unit-testable and reusable by the
 * Scan UI. Returns null when nothing resolves.
 */
export function mapPredictionToPlant(
  result: ScanResult,
  plants: Plant[],
): PlantMatch | null {
  const idx = buildIndex(plants);

  interface Tally {
    plant: Plant;
    total: number;
    best: CategoryPrediction;
  }
  const byPlant = new Map<string, Tally>();

  for (const obj of result.object_predictions) {
    for (const { category } of obj.predictions) {
      const plant = resolvePlant(category.name, idx);
      if (!plant) continue;
      const cur = byPlant.get(plant.id);
      if (!cur) {
        byPlant.set(plant.id, { plant, total: category.score, best: category });
      } else {
        cur.total += category.score;
        if (category.score > cur.best.score) cur.best = category;
      }
    }
  }

  let winner: Tally | null = null;
  for (const t of byPlant.values()) {
    if (!winner || t.total > winner.total) winner = t;
  }
  if (!winner) return null;

  return {
    plant: winner.plant,
    confidence: winner.best.score,
    matchedOn: winner.best.name,
  };
}

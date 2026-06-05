import type { Plant } from "../types/plant";
import type { ScanResult, ObjectPrediction } from "./predictionTypes";

export interface PlantMatch {
  plant: Plant;
  /** The category score that produced the match (0–1). */
  confidence: number;
  /** The prediction label we matched on (for debugging/UI). */
  matchedOn: string;
  /** The detected object's bbox, so the UI can frame the subject. */
  bbox: [number, number, number, number];
}

/** Default minimum confidence for a category guess to count. The Scan UI keeps
 *  this in sync so it can explain "saw something, but wasn't sure enough". */
export const DEFAULT_MIN_CONFIDENCE = 0.4;

function normalize(s: string): string {
  return s.toLowerCase().replace(/[×]/g, "x").replace(/\s+/g, " ").trim();
}

/** Fraction of the frame a normalized bbox covers (0–1). */
function bboxArea([x1, y1, x2, y2]: [number, number, number, number]): number {
  return Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
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

/** Resolve a category name to a plant: exact match first, then a loose
 *  substring match in either direction (≥4 chars to avoid silly hits). */
function lookup(name: string, idx: Map<string, Plant>): Plant | undefined {
  const n = normalize(name);
  const exact = idx.get(n);
  if (exact) return exact;
  for (const [key, plant] of idx) {
    if (key.length >= 4 && (n.includes(key) || key.includes(n))) return plant;
  }
  return undefined;
}

/** The best (highest-scoring) category guess for one detected object. */
function topGuess(obj: ObjectPrediction): { name: string; score: number } | null {
  let best: { name: string; score: number } | null = null;
  for (const p of obj.predictions) {
    if (!best || p.category.score > best.score) {
      best = { name: p.category.name, score: p.category.score };
    }
  }
  return best;
}

/**
 * Maps a flat Dragoneye `recognize_anything` result to a Plantdex entry.
 *
 * Picks the **most prominent** plant: among all detected objects whose top guess
 * clears `minConfidence`, it prefers the one with the largest bounding box
 * (tie-broken by score), then resolves that guess's category name to a plant by
 * common/scientific name or alias. Returns the best match or null.
 *
 * Pure and dependency-free so it's trivially unit-testable and reusable by the
 * Scan UI.
 */
export function mapPredictionToPlant(
  result: ScanResult,
  plants: Plant[],
  minConfidence: number = DEFAULT_MIN_CONFIDENCE,
): PlantMatch | null {
  const idx = buildIndex(plants);

  const candidates = (result.object_predictions ?? [])
    .map((obj) => {
      const guess = topGuess(obj);
      return guess
        ? { ...guess, area: bboxArea(obj.normalizedBbox), bbox: obj.normalizedBbox }
        : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null && c.score >= minConfidence)
    // Most prominent first: largest box wins, score breaks ties.
    .sort((a, b) => b.area - a.area || b.score - a.score);

  for (const c of candidates) {
    const plant = lookup(c.name, idx);
    if (plant) {
      return { plant, confidence: c.score, matchedOn: c.name, bbox: c.bbox };
    }
  }

  return null;
}

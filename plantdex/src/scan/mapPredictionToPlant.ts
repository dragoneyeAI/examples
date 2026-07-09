import type { Plant } from "../types/plant";
import type {
  ClassificationResult,
  TaxonPrediction,
} from "./predictionTypes";

export interface PlantMatch {
  plant: Plant;
  /** The taxon score that produced the match (0–1). */
  confidence: number;
  /** The prediction label we matched on (for debugging/UI). */
  matchedOn: string;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[×]/g, "x").replace(/\s+/g, " ").trim();
}

/** Flatten a recursive TaxonPrediction tree into (name, score) candidates,
 *  deepest/most-specific nodes first so we prefer species over family. */
function collectTaxa(
  node: TaxonPrediction,
  depth = 0,
): Array<{ name: string; score: number; depth: number }> {
  const here = { name: node.displayName, score: node.score, depth };
  const kids = (node.children ?? []).flatMap((c) => collectTaxa(c, depth + 1));
  return [...kids, here]; // children (deeper) first
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
 * Maps a Dragoneye classification result to a Plantdex entry. Walks the
 * prediction's recursive category taxonomy (most-specific first), and matches
 * each taxon's displayName against plant common/scientific names + aliases —
 * first by exact match, then by substring. Returns the best match or null.
 *
 * Pure and dependency-free so it's trivially unit-testable and reusable by the
 * future Scan UI.
 */
export function mapPredictionToPlant(
  result: ClassificationResult,
  plants: Plant[],
): PlantMatch | null {
  const idx = buildIndex(plants);

  // Consider every prediction's category tree; rank candidate taxa by
  // specificity (depth) then score.
  const candidates = result.predictions
    .flatMap((pr) => collectTaxa(pr.category))
    .sort((a, b) => b.depth - a.depth || b.score - a.score);

  // 1) exact name match
  for (const c of candidates) {
    const hit = idx.get(normalize(c.name));
    if (hit) return { plant: hit, confidence: c.score, matchedOn: c.name };
  }

  // 2) fuzzy: a plant key contained in the taxon name or vice-versa
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

import { PLANTS } from "../data/plants";
import {
  mapPredictionToPlant,
  collectCategories,
  type PlantMatch,
} from "./mapPredictionToPlant";
import type { ImagePredictionResult } from "./predictionTypes";

// The scan runs through our own Cloudflare Pages Function (`POST /api/scan`),
// which holds the Dragoneye API key server-side and returns the flat prediction
// JSON. Nothing here touches the key or the Dragoneye SDK — that's the whole
// point: the key never ships to the browser. See functions/api/scan.ts.

export interface ScanResult {
  /** The resolved Plantdex entry, or null if no category matched a plant. */
  match: PlantMatch | null;
  /** Top raw category guesses (name + 0–1 score), for the "couldn't identify" UI. */
  topGuesses: Array<{ name: string; score: number }>;
}

/**
 * Sends a captured photo to the `/api/scan` Function and resolves the prediction
 * to a Plantdex entry via the pure `mapPredictionToPlant` bridge.
 *
 * Throws if the request fails — the caller renders a friendly error.
 */
export async function predictPlantFromFile(file: File): Promise<ScanResult> {
  const form = new FormData();
  form.append("image", file);

  const res = await fetch("/api/scan", { method: "POST", body: form });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error ?? `Scan request failed (${res.status})`);
  }

  const result = (await res.json()) as ImagePredictionResult;

  return {
    match: mapPredictionToPlant(result, PLANTS),
    topGuesses: collectCategories(result)
      .slice(0, 3)
      .map((c) => ({ name: c.name, score: c.score })),
  };
}

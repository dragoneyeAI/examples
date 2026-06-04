// Shape of a scan result as returned by `POST /api/scan`.
//
// The Pages Function (`functions/api/scan.ts`) drives the `dragoneye-node` SDK
// against the custom `recognize_anything/plantdex` model and passes the SDK's
// `ClassificationPredictImageResponse` straight through to the client as JSON.
//
// Custom `recognize_anything` models return a FLAT shape — unlike the recursive
// `TaxonPrediction` (with `children`) used by the hosted `dragoneye/*` models,
// each prediction here is a single `{ id, name, score }` category, where `name`
// is exactly one of the category names defined when the model was built (for
// Plantdex, a plant's Latin or common name). `mapPredictionToPlant` matches on
// that name to recover the dex entry.

export interface CategoryPrediction {
  id: number;
  /** Exactly one of the model's category names (a plant Latin/common name). */
  name: string;
  /** Confidence for this category, 0–1. */
  score: number;
}

export interface ObjectPrediction {
  /** `[x1, y1, x2, y2]`, values 0–1. */
  normalizedBbox: [number, number, number, number];
  predictions: Array<{ category: CategoryPrediction }>;
}

export interface ScanResult {
  object_predictions: ObjectPrediction[];
}

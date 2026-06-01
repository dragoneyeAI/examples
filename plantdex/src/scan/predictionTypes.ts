// Minimal shape of a Dragoneye image-classification result — the JSON our
// `/api/scan` Pages Function returns (see functions/api/scan.ts). That Function
// runs the `dragoneye-node` SDK server-side and flattens its
// `ClassificationPredictImageResponse` down to the fields below. We keep this
// type local so `mapPredictionToPlant` stays pure and trivially unit-testable.
//
// The Scan flow:
//
//   const res = await fetch("/api/scan", { method: "POST", body: form });
//   const result = await res.json();                 // ImagePredictionResult
//   const match = mapPredictionToPlant(result, PLANTS);
//
// and then store.discover(match.plant.id, "scan", { confidence, rawPrediction }).
//
// Unlike the older hosted `dragoneye/fashion` models (which returned a recursive
// taxonomy), a custom `recognize_anything` model returns a FLAT result: each
// detected object carries one or more category predictions, where `category.name`
// is exactly one of the names we defined when building the model.

export interface PredictedCategory {
  id: number;
  name: string;
  score: number;
}

export interface CategoryPrediction {
  category: PredictedCategory;
  /** Attribute predictions — unused by Plantdex, modeled loosely. */
  attributes?: unknown[];
}

export interface ObjectPrediction {
  normalizedBbox: [number, number, number, number];
  predictions: CategoryPrediction[];
}

export interface ImagePredictionResult {
  object_predictions: ObjectPrediction[];
}

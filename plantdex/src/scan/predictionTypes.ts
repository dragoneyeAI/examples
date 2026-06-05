// Shape of the Dragoneye result the Scan feature works with.
//
// Plantdex's model is a **custom `recognize_anything` model** (`recognize_anything/plantdex`,
// built via the Dragoneye MCP). Unlike the hosted models in the other examples,
// it returns a **flat** result — there is NO recursive `category.children`
// taxonomy. Each detected object carries a list of category predictions, and
// `category.name` is exactly one of the category names defined when the model
// was created (here: a plant's common name, e.g. "Snake Plant").
//
// This mirrors the `dragoneye-node` SDK's `ClassificationPredictImageResponse`.
// The `/api/scan` Pages Function calls the SDK server-side and returns this
// JSON verbatim to the client, which feeds it through `mapPredictionToPlant`.

/** A single category guess for a detected object. */
export interface CategoryPrediction {
  id: number;
  /** Exactly one of the model's category names (a plant common name). */
  name: string;
  /** Confidence 0–1. */
  score: number;
}

export interface AttributePrediction {
  attribute_id: number;
  name: string;
  options: { option_id: number; name: string; score: number }[];
}

export interface ObjectPrediction {
  /** `[x1, y1, x2, y2]`, all 0–1, relative to image dimensions. */
  normalizedBbox: [number, number, number, number];
  /** Category guesses for this object, best-first is not guaranteed. */
  predictions: { category: CategoryPrediction; attributes: AttributePrediction[] }[];
}

/** Top-level image prediction result (`object_predictions[]`). */
export interface ScanResult {
  object_predictions: ObjectPrediction[];
  prediction_task_uuid?: string;
  original_file_name?: string | null;
}

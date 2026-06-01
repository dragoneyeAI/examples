// Minimal shape of a Dragoneye classification result, mirroring the
// `dragoneye-node` SDK response used by the clothing example. We only model
// the fields the Plantdex bridge needs. The FUTURE Scan feature will call:
//
//   const res = await client.classification.predict({
//     image: { blob }, modelName: "dragoneye/<plant-model>"
//   });
//   const match = mapPredictionToPlant(res, PLANTS);
//
// and then store.discover({ plantId: match.plant.id, source: "scan", ... }).

export interface TaxonPrediction {
  id: string;
  displayName: string;
  score: number;
  children: TaxonPrediction[];
}

export interface ClassificationPrediction {
  normalizedBbox: [number, number, number, number];
  category: TaxonPrediction;
  traits: unknown[];
}

export interface ClassificationResult {
  predictions: ClassificationPrediction[];
}

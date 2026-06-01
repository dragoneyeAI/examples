import { describe, it, expect } from "vitest";
import { mapPredictionToPlant } from "./mapPredictionToPlant";
import type { ImagePredictionResult, PredictedCategory } from "./predictionTypes";
import type { Plant } from "../types/plant";

// Two minimal fixture plants — enough to prove matching by common name,
// scientific name / alias, and highest-score-wins across objects.
const plants = [
  {
    id: "fiddle-leaf-fig",
    commonName: "Fiddle Leaf Fig",
    latinName: "Ficus lyrata",
    taxonRef: {
      scientificName: "Ficus lyrata",
      aliases: ["fiddle leaf fig", "ficus lyrata", "banjo fig"],
    },
  },
  {
    id: "snake-plant",
    commonName: "Snake Plant",
    latinName: "Dracaena trifasciata",
    taxonRef: {
      scientificName: "Dracaena trifasciata",
      aliases: ["snake plant", "mother-in-law's tongue"],
    },
  },
] as unknown as Plant[];

let nextId = 1;
function cat(name: string, score: number): PredictedCategory {
  return { id: nextId++, name, score };
}

/** Build a single-object result from one or more category predictions. */
function result(...categories: PredictedCategory[]): ImagePredictionResult {
  return {
    object_predictions: [
      {
        normalizedBbox: [0, 0, 1, 1],
        predictions: categories.map((category) => ({ category, attributes: [] })),
      },
    ],
  };
}

describe("mapPredictionToPlant", () => {
  it("matches the model's category name exactly (common name)", () => {
    const match = mapPredictionToPlant(result(cat("Fiddle Leaf Fig", 0.93)), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
    expect(match?.confidence).toBeCloseTo(0.93);
  });

  it("matches via an alias / scientific name, case-insensitively", () => {
    const match = mapPredictionToPlant(result(cat("DRACAENA TRIFASCIATA", 0.81)), plants);
    expect(match?.plant.id).toBe("snake-plant");
  });

  it("prefers the highest-scoring category across multiple objects", () => {
    const res: ImagePredictionResult = {
      object_predictions: [
        {
          normalizedBbox: [0, 0, 0.5, 1],
          predictions: [{ category: cat("Snake Plant", 0.42), attributes: [] }],
        },
        {
          normalizedBbox: [0.5, 0, 1, 1],
          predictions: [{ category: cat("Fiddle Leaf Fig", 0.88), attributes: [] }],
        },
      ],
    };
    const match = mapPredictionToPlant(res, plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
    expect(match?.confidence).toBeCloseTo(0.88);
  });

  it("returns null when nothing matches", () => {
    expect(mapPredictionToPlant(result(cat("Tyrannosaurus rex", 0.99)), plants)).toBeNull();
  });
});

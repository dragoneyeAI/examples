import { describe, it, expect } from "vitest";
import { mapPredictionToPlant } from "./mapPredictionToPlant";
import type { ScanResult, CategoryPrediction } from "./predictionTypes";
import type { Plant } from "../types/plant";

// Two minimal fixture plants — enough to prove matching by scientific name,
// alias/common name, and the most-confident-category-wins behavior.
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
function category(name: string, score: number): CategoryPrediction {
  return { id: nextId++, name, score };
}

/** Wrap one or more flat category predictions as a single detected object. */
function result(...categories: CategoryPrediction[]): ScanResult {
  return {
    object_predictions: [
      {
        normalizedBbox: [0, 0, 1, 1],
        predictions: categories.map((category) => ({ category })),
      },
    ],
  };
}

/** One object per category — models a busy photo with many detected regions. */
function multiObject(...categories: CategoryPrediction[]): ScanResult {
  return {
    object_predictions: categories.map((category) => ({
      normalizedBbox: [0, 0, 1, 1] as [number, number, number, number],
      predictions: [{ category }],
    })),
  };
}

describe("mapPredictionToPlant", () => {
  it("matches a category by scientific name", () => {
    const match = mapPredictionToPlant(result(category("Ficus lyrata", 0.91)), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
    expect(match?.confidence).toBeCloseTo(0.91);
  });

  it("prefers the highest-scoring category", () => {
    const match = mapPredictionToPlant(
      result(category("Ficus lyrata", 0.42), category("Snake Plant", 0.88)),
      plants,
    );
    expect(match?.plant.id).toBe("snake-plant");
    expect(match?.confidence).toBeCloseTo(0.88);
  });

  it("matches via an alias / common name", () => {
    const match = mapPredictionToPlant(result(category("Snake Plant", 0.8)), plants);
    expect(match?.plant.id).toBe("snake-plant");
  });

  it("matches case-insensitively and tolerates the × hybrid sign", () => {
    const match = mapPredictionToPlant(result(category("FICUS LYRATA", 0.8)), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
  });

  it("returns null when nothing matches", () => {
    const match = mapPredictionToPlant(result(category("Tyrannosaurus rex", 0.99)), plants);
    expect(match).toBeNull();
  });

  it("returns null when there are no object predictions", () => {
    expect(mapPredictionToPlant({ object_predictions: [] }, plants)).toBeNull();
  });

  it("uses score-weighted voting across many detected objects", () => {
    // The true subject is detected many times at modest confidence; a single
    // stray detection of another plant scores higher. Voting should still pick
    // the subject (total mass 4×0.3 = 1.2 > 0.85), and report its best score.
    const scan = multiObject(
      category("Ficus lyrata", 0.3),
      category("Snake Plant", 0.85),
      category("Ficus lyrata", 0.3),
      category("Ficus lyrata", 0.35),
      category("Ficus lyrata", 0.3),
    );
    const match = mapPredictionToPlant(scan, plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
    expect(match?.confidence).toBeCloseTo(0.35);
  });
});

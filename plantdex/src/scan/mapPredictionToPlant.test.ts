import { describe, it, expect } from "vitest";
import {
  mapPredictionToPlant,
  DEFAULT_MIN_CONFIDENCE,
} from "./mapPredictionToPlant";
import type { ScanResult, ObjectPrediction } from "./predictionTypes";
import type { Plant } from "../types/plant";

// Two minimal fixture plants — enough to prove matching by scientific name,
// common name, and alias.
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

/** Build one detected object with a single category guess. */
function obj(
  name: string,
  score: number,
  bbox: [number, number, number, number] = [0, 0, 1, 1],
): ObjectPrediction {
  return {
    normalizedBbox: bbox,
    predictions: [{ category: { id: 1, name, score }, attributes: [] }],
  };
}

function result(...objects: ObjectPrediction[]): ScanResult {
  return { object_predictions: objects };
}

describe("mapPredictionToPlant", () => {
  it("matches a category name to a plant by common name", () => {
    const match = mapPredictionToPlant(result(obj("Snake Plant", 0.9)), plants);
    expect(match?.plant.id).toBe("snake-plant");
    expect(match?.confidence).toBeCloseTo(0.9);
    expect(match?.matchedOn).toBe("Snake Plant");
  });

  it("matches case-insensitively and tolerates the × hybrid sign", () => {
    const match = mapPredictionToPlant(result(obj("FICUS LYRATA", 0.8)), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
  });

  it("matches via an alias", () => {
    const match = mapPredictionToPlant(result(obj("banjo fig", 0.7)), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
  });

  it("prefers the most prominent (largest bbox) plant", () => {
    const small = obj("Snake Plant", 0.95, [0, 0, 0.2, 0.2]); // tiny but high score
    const large = obj("Fiddle Leaf Fig", 0.6, [0, 0, 0.9, 0.9]); // dominant subject
    const match = mapPredictionToPlant(result(small, large), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
  });

  it("ignores guesses below the confidence threshold", () => {
    const weak = mapPredictionToPlant(
      result(obj("Snake Plant", DEFAULT_MIN_CONFIDENCE - 0.05)),
      plants,
    );
    expect(weak).toBeNull();
  });

  it("falls back to a smaller object when the largest is below threshold", () => {
    const bigUnsure = obj("Snake Plant", 0.2, [0, 0, 1, 1]);
    const smallSure = obj("Fiddle Leaf Fig", 0.85, [0, 0, 0.3, 0.3]);
    const match = mapPredictionToPlant(result(bigUnsure, smallSure), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
  });

  it("returns null when nothing matches a known plant", () => {
    expect(
      mapPredictionToPlant(result(obj("Tyrannosaurus rex", 0.99)), plants),
    ).toBeNull();
  });

  it("returns null for an empty result", () => {
    expect(mapPredictionToPlant(result(), plants)).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { mapPredictionToPlant } from "./mapPredictionToPlant";
import type { ClassificationResult, TaxonPrediction } from "./predictionTypes";
import type { Plant } from "../types/plant";

// Two minimal fixture plants — enough to prove matching by scientific name,
// alias, and the deepest-taxon-wins behavior.
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

function taxon(
  displayName: string,
  score: number,
  children: TaxonPrediction[] = [],
): TaxonPrediction {
  return { id: displayName, displayName, score, children };
}

function result(category: TaxonPrediction): ClassificationResult {
  return { predictions: [{ normalizedBbox: [0, 0, 1, 1], category, traits: [] }] };
}

describe("mapPredictionToPlant", () => {
  it("matches the deepest (most specific) taxon by scientific name", () => {
    const tree = taxon("Plant", 0.99, [
      taxon("Moraceae", 0.95, [taxon("Ficus lyrata", 0.91)]),
    ]);
    const match = mapPredictionToPlant(result(tree), plants);
    expect(match?.plant.id).toBe("fiddle-leaf-fig");
    expect(match?.confidence).toBeCloseTo(0.91);
  });

  it("matches via an alias / common name", () => {
    const tree = taxon("Snake Plant", 0.88);
    const match = mapPredictionToPlant(result(tree), plants);
    expect(match?.plant.id).toBe("snake-plant");
  });

  it("matches case-insensitively and tolerates the × hybrid sign", () => {
    const tree = taxon("FICUS LYRATA", 0.8);
    expect(mapPredictionToPlant(result(tree), plants)?.plant.id).toBe(
      "fiddle-leaf-fig",
    );
  });

  it("returns null when nothing matches", () => {
    const tree = taxon("Tyrannosaurus rex", 0.99);
    expect(mapPredictionToPlant(result(tree), plants)).toBeNull();
  });
});

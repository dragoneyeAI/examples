// Maps human-readable care fields → 0–100 Pokédex stat bars. Seed entries may
// override any stat explicitly; everything else is derived by keyword rules.

import type { PlantStats, PlantType } from "../../src/types/plant";
import type { SeedPlant } from "./seedTypes";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function lightStat(text: string): number {
  const t = text.toLowerCase();
  // Order matters: "bright indirect" must not match "direct".
  if (t.includes("bright indirect") || t.includes("indirect")) return 68;
  if (t.includes("full sun") || t.includes("direct")) return 92;
  if (t.includes("bright")) return 78;
  if (t.includes("medium") || t.includes("partial") || t.includes("morning"))
    return 52;
  if (t.includes("low") || t.includes("shade")) return 28;
  return 55;
}

function waterStat(text: string): number {
  const t = text.toLowerCase();
  if (t.includes("dai")) return 90;
  if (t.includes("twice") || t.includes("2x")) return 80;
  if (t.includes("week")) return 60;
  if (t.includes("10 day") || t.includes("biweek") || t.includes("two week"))
    return 45;
  if (
    t.includes("month") ||
    t.includes("sparing") ||
    t.includes("drought") ||
    t.includes("rare") ||
    t.includes("dry")
  )
    return 22;
  return 50;
}

function humidityStat(text: string | undefined, types: PlantType[]): number {
  if (text) {
    const t = text.toLowerCase();
    if (t.includes("high")) return 85;
    if (t.includes("medium") || t.includes("moderate")) return 55;
    if (t.includes("low")) return 25;
  }
  // type-based default
  if (types.includes("fern")) return 80;
  if (types.includes("succulent") || types.includes("cactus")) return 20;
  return 50;
}

function growthStat(types: PlantType[]): number {
  if (types.includes("vine") || types.includes("herb")) return 80;
  if (types.includes("flower")) return 70;
  if (types.includes("houseplant")) return 55;
  if (types.includes("tree")) return 40;
  if (types.includes("cactus") || types.includes("succulent")) return 28;
  return 50;
}

function toxicityStat(petSafe: boolean | undefined): number {
  if (petSafe === true) return 10;
  if (petSafe === false) return 78;
  return 45;
}

/** Difficulty rises with fussy humidity + precise watering, falls for
 *  forgiving succulents/cacti. */
function difficultyStat(
  water: number,
  humidity: number,
  types: PlantType[],
): number {
  let d = 40;
  if (humidity >= 80) d += 22;
  if (water >= 80) d += 14;
  if (water <= 25) d -= 8; // drought-tolerant = forgiving
  if (types.includes("succulent") || types.includes("cactus")) d -= 18;
  if (types.includes("fern")) d += 16;
  if (types.includes("tree")) d -= 6;
  return d;
}

export function deriveStats(seed: SeedPlant): PlantStats {
  const light = seed.stats?.light ?? lightStat(seed.care.light);
  const water = seed.stats?.water ?? waterStat(seed.care.watering);
  const humidity =
    seed.stats?.humidity ?? humidityStat(seed.care.humidity, seed.types);
  const growthRate = seed.stats?.growthRate ?? growthStat(seed.types);
  const toxicity = seed.stats?.toxicity ?? toxicityStat(seed.care.petSafe);
  const difficulty =
    seed.stats?.difficulty ?? difficultyStat(water, humidity, seed.types);
  return {
    light: clamp(light),
    water: clamp(water),
    humidity: clamp(humidity),
    difficulty: clamp(difficulty),
    growthRate: clamp(growthRate),
    toxicity: clamp(toxicity),
  };
}

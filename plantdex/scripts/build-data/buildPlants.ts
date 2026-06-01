// Plantdex data pipeline — run with `pnpm build:data`.
//
// Reads the curated seed lists (houseplants / NYC trees / NYC flora), enriches
// each with a Wikipedia flavor blurb + a stable Wikimedia Commons image +
// attribution, derives Pokédex stats, merges manual overrides, validates the
// whole dataset against plants.schema.json, and writes data/plants.json.
//
// The output is committed, so the shipped app has ZERO runtime dependency on
// these APIs. This script is developer-tooling only and never bundled.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv from "ajv";

import type { Plant, PlantDataset } from "../../src/types/plant";
import type { SeedPlant } from "./seedTypes";
import { deriveStats } from "./deriveStats";
import { getWikiSummary } from "./enrichWikipedia";
import {
  getCommonsAttribution,
  getWikidataImageFile,
  fileNameFromUploadUrl,
  commonsFilePath,
} from "./enrichWikidata";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const SOURCES = join(HERE, "sources");

const SCHEMA_VERSION = 1;
const THUMB_WIDTH = 400;
const FULL_WIDTH = 1024;

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function loadSeeds(): SeedPlant[] {
  const files = ["houseplants.json", "nyc-trees.json", "nyc-flora.json"];
  return files.flatMap((f) => readJson<SeedPlant[]>(join(SOURCES, f)));
}

/** Resolve a stable image + attribution for one seed. */
async function resolveImage(seed: SeedPlant, wikidataId?: string) {
  // Prefer the Wikidata P18 file (gives us a clean Commons filename we can
  // resize + attribute precisely). Fall back to the Wikipedia lead image.
  let fileName: string | null = null;
  if (wikidataId) fileName = await getWikidataImageFile(wikidataId);

  if (fileName) {
    const attribution =
      (await getCommonsAttribution(fileName)) ?? { license: "See source" };
    return {
      url: commonsFilePath(fileName, FULL_WIDTH),
      thumbUrl: commonsFilePath(fileName, THUMB_WIDTH),
      attribution,
    };
  }
  return null;
}

async function buildOne(
  seed: SeedPlant,
  dexNumber: number,
): Promise<Plant | null> {
  const title = seed.wikipediaTitle ?? seed.latinName;
  const summary = await getWikiSummary(title);

  if (!summary) {
    console.warn(`  ✗ ${seed.commonName}: no Wikipedia summary for "${title}"`);
    return null;
  }

  // Image: try Wikidata P18 (best for attribution), else fall back to the
  // summary's lead image + a Commons attribution lookup by filename.
  let image = await resolveImage(seed, summary.wikidataId);
  if (!image && summary.imageUrl) {
    const fileName = fileNameFromUploadUrl(summary.imageUrl);
    const attribution = fileName
      ? ((await getCommonsAttribution(fileName)) ?? { license: "See source" })
      : { license: "See source" };
    image = {
      url: summary.imageUrl,
      thumbUrl: summary.thumbUrl ?? summary.imageUrl,
      attribution,
    };
  }

  if (!image) {
    console.warn(`  ✗ ${seed.commonName}: no image found`);
    return null;
  }

  const aliases = Array.from(
    new Set(
      [
        seed.commonName.toLowerCase(),
        seed.latinName.toLowerCase(),
        ...(seed.aliases ?? []),
      ].map((a) => a.toLowerCase()),
    ),
  );

  const plant: Plant = {
    id: seed.id,
    dexNumber,
    commonName: seed.commonName,
    latinName: seed.latinName,
    family: seed.family,
    types: seed.types,
    habitat: seed.habitat,
    flavorText: summary.extract,
    stats: deriveStats(seed),
    care: seed.care,
    bloomMonths: seed.bloomMonths,
    image,
    taxonRef: {
      wikidataId: summary.wikidataId,
      scientificName: seed.latinName,
      aliases,
    },
  };

  console.log(`  ✓ #${dexNumber} ${seed.commonName}  (${image.attribution.license})`);
  return plant;
}

/** Shallow-ish deep merge for the overrides layer (objects merge, scalars/arrays replace). */
function deepMerge<T>(base: T, patch: Partial<T>): T {
  const out = { ...base } as Record<string, unknown>;
  for (const [k, v] of Object.entries(patch as Record<string, unknown>)) {
    const cur = out[k];
    if (
      v &&
      typeof v === "object" &&
      !Array.isArray(v) &&
      cur &&
      typeof cur === "object" &&
      !Array.isArray(cur)
    ) {
      out[k] = deepMerge(cur, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function applyOverrides(plants: Plant[]): Plant[] {
  const overrides = readJson<Record<string, Partial<Plant>>>(
    join(HERE, "overrides.json"),
  );
  return plants.map((p) =>
    overrides[p.id] ? deepMerge(p, overrides[p.id]) : p,
  );
}

function validate(dataset: PlantDataset) {
  const schema = readJson<object>(join(ROOT, "data", "plants.schema.json"));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const valid = ajv.validate(schema, dataset);
  if (!valid) {
    console.error("\n✗ Schema validation FAILED:");
    for (const err of ajv.errors ?? []) {
      console.error(`  ${err.instancePath} ${err.message}`);
    }
    process.exit(1);
  }
  console.log("✓ Schema validation passed");
}

async function main() {
  const seeds = loadSeeds();
  console.log(`Building ${seeds.length} plants…\n`);

  const plants: Plant[] = [];
  let dex = 1;
  for (const seed of seeds) {
    const plant = await buildOne(seed, dex);
    if (plant) {
      plants.push(plant);
      dex++;
    }
  }

  const finalized = applyOverrides(plants);

  const dataset: PlantDataset = {
    schemaVersion: SCHEMA_VERSION,
    // Deterministic timestamp source: read existing file's date if present so
    // unchanged rebuilds don't churn the diff; otherwise use a build env stamp.
    generatedAt: stableTimestamp(),
    plantCount: finalized.length,
    plants: finalized,
  };

  validate(dataset);

  const outPath = join(ROOT, "data", "plants.json");
  writeFileSync(outPath, JSON.stringify(dataset, null, 2) + "\n");
  console.log(`\n✓ Wrote ${finalized.length} plants → ${outPath}`);
}

function stableTimestamp(): string {
  const out = join(ROOT, "data", "plants.json");
  if (existsSync(out)) {
    try {
      const prev = readJson<PlantDataset>(out);
      if (prev.generatedAt && prev.generatedAt !== "1970-01-01T00:00:00.000Z")
        return prev.generatedAt;
    } catch {
      /* ignore */
    }
  }
  return new Date().toISOString();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

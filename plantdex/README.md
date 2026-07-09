# Plantdex 🌿

A **Pokédex for plants** — browse stats and info, search/look up plants, and
collect the ones you've seen. Themed around **common houseplants, herbs, and the
trees & flowers you actually see around New York City**.

Plantdex is a **fully client-side** app: it loads once and then runs entirely in
the browser with **no further server calls**. All plant data is bundled with the
app (`data/plants.json`); only the plant **images** are loaded on demand from
Wikimedia Commons (URLs are baked into the data). It's an installable PWA, tuned
for **iPhone / iOS Safari**.

> Built as an example for the [Dragoneye](https://dragoneye.ai) vision API. The
> **Scan** tab is a placeholder for a future feature: snap a photo → call a
> server for a species prediction → save it as a discovery. The architecture is
> already wired for it (see [Future: photo scan](#future-photo-scan)).

## Stack

- **Vite + React + TypeScript**
- **framer-motion** for animations (stat bars, card/detail transitions, the
  discovery celebration) — all gated behind `prefers-reduced-motion`
- **vite-plugin-pwa** (Workbox) for offline + home-screen install
- **localStorage** for the collection (behind a swappable `PlantdexStore`)

## Develop

```bash
pnpm install
pnpm dev          # dev server
pnpm build        # typecheck + production build → dist/
pnpm preview      # serve the production build
pnpm test         # unit tests (vitest)
pnpm typecheck
```

## The plant dataset

`data/plants.json` is **generated and committed** — the app ships with zero
runtime dependency on any external API. Regenerate it with:

```bash
pnpm build:data
```

That runs the offline pipeline in `scripts/build-data/`, which:

1. reads the curated seed lists in `scripts/build-data/sources/`
   (`houseplants.json`, `nyc-trees.json` from the NYC Street Tree Census species
   list, and `nyc-flora.json`),
2. enriches each plant with a **stable Wikimedia Commons image + attribution**
   (Wikidata `P18` / Commons API) and a **flavor blurb** (Wikipedia REST summary),
3. derives the six Pokédex **stats** and assigns **types** (`deriveStats.ts`),
4. merges any manual fixes from `overrides.json`,
5. validates every record against `data/plants.schema.json` and writes
   `data/plants.json`.

To add a plant, add a seed entry and re-run `pnpm build:data`. To hand-tune a
stat/type/image, add an entry to `overrides.json` (deep-merged last).

### Record shape

Each plant has a stable `id`, `dexNumber`, names, `types`, `habitat`
(`indoor`/`street`/`park`), `flavorText`, six `stats` (0–100), human-readable
`care`, optional `bloomMonths`, an `image` (with mandatory Commons
`attribution`), and a `taxonRef` (`scientificName` + `aliases`) used to match
future predictions. See `src/types/plant.ts`.

## Future: photo scan

The **Scan** tab is a placeholder today. When wired up it will mirror the
`dragoneye-clothing-react-app` flow:

```ts
const res = await client.classification.predict({
  image: { blob }, modelName: "dragoneye/<plant-model>",
});
const match = mapPredictionToPlant(res, PLANTS);     // src/scan/mapPredictionToPlant.ts
if (match) await store.discover({ plantId: match.plant.id, source: "scan", rawPrediction: res });
```

`mapPredictionToPlant` (pure + unit-tested) walks the recursive
`TaxonPrediction` tree and matches the most-specific taxon against each plant's
`taxonRef`. The `PlantdexStore` interface and `DiscoveryRecord` already carry the
`photoRef` / `rawPrediction` / `confidence` fields a scan needs — swapping
`LocalStorageStore` for an IndexedDB implementation (for photo blobs) requires no
UI changes.

## Image credits

Plant photos come from **Wikimedia Commons** and are shown with per-image
attribution (author + license) in each plant's detail view, as the licenses
require.

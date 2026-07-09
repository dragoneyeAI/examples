# Plantdex 🌿

A **Pokédex for plants** — browse stats and info, search/look up plants, and
collect the ones you've seen. Themed around **common houseplants, herbs, and the
trees & flowers you actually see around New York City**.

Plantdex is **client-side and offline-first**: browsing, search, and your
collection all run in the browser, and every plant's data is bundled with the app
(`data/plants.json`), so the core experience needs no network at all. It's an
installable PWA, tuned for **iPhone / iOS Safari**.

Only two things go over the wire: plant **images**, loaded on demand from
Wikimedia Commons (URLs are baked into the data), and — on the **Scan** tab — a
liveness ping to a small companion backend (see
[Backend](#backend-cloudflare-pages-functions)).

> Built as an example for the [Dragoneye](https://dragoneye.ai) vision API. The
> **Scan** tab is a placeholder for a future feature: snap a photo → send it to a
> server for a species prediction → save it as a discovery. The server side is
> already scaffolded — a `/api/health` check today (see
> [Future: photo scan](#future-photo-scan)).

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

## Backend (Cloudflare Pages Functions)

The future Scan feature needs a server so the Dragoneye API key never reaches the
browser. That server lives in `functions/` as **Cloudflare Pages Functions**
(file-based routing). Today there's a single endpoint — `GET /api/health` — which
a small status pill on the **Scan** tab calls to prove the client→Function path
end to end.

```bash
pnpm pages:dev    # Vite + Functions on one origin (Wrangler), with HMR
```

Plain `pnpm dev` does **not** serve Functions, so the Scan pill reads
"API: down" — that's expected; use `pnpm pages:dev` to exercise `/api/health`.
The Dragoneye key is read server-side via `context.env.DRAGONEYE_API_KEY` (never
`VITE_`-prefixed, so never bundled into the client). For local runs that need it,
put it in `.dev.vars` (gitignored): `DRAGONEYE_API_KEY=your-key`.

## Deploy

Deploys build locally and upload `dist/` + `functions/` straight to Cloudflare
Pages (direct upload) — no Git/CI round-trip needed:

```bash
pnpm deploy:preview   # deploy the CURRENT branch as a preview
pnpm deploy:prod      # deploy to PRODUCTION (the `main` branch)
```

Production vs preview is decided purely by branch name: `deploy:prod` targets the
project's production branch (`main`); `deploy:preview` tags the deploy with your
current git branch, which gets its own `<branch>.<project>.pages.dev` URL. (Don't
run `deploy:preview` while on `main` — it would land on production.)

**One-time setup:**

1. Authenticate Wrangler: `npx wrangler login` (or set `CLOUDFLARE_API_TOKEN` +
   `CLOUDFLARE_ACCOUNT_ID` for non-interactive use).
2. Create the Pages project once — skip if it already exists or is Git-connected
   (CLI direct uploads work against Git-connected projects too):
   `npx wrangler pages project create plantdex --production-branch main`.
3. For the Scan feature, set the server secret (the healthcheck doesn't need it):
   `npx wrangler pages secret put DRAGONEYE_API_KEY --project-name plantdex`.

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

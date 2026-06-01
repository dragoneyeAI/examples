# Plantdex 🌿

A **Pokédex for plants** — browse stats and info, search/look up plants, and
collect the ones you've seen. Themed around **common houseplants, herbs, and the
trees & flowers you actually see around New York City**.

Plantdex is **offline-first**: it loads once and then browses, searches, and
collects entirely in the browser. All plant data is bundled with the app
(`data/plants.json`); only the plant **images** load on demand from Wikimedia
Commons (URLs are baked into the data). It's an installable PWA, tuned for
**iPhone / iOS Safari**.

> Built as an example for the [Dragoneye](https://dragoneye.ai) vision API. The
> **Scan** tab is live: snap a photo → a **Cloudflare Pages Function** (`/api/scan`)
> runs it through the Dragoneye `plantdex` model with the key kept server-side → the
> matched species is saved to your collection (see [Photo scan](#photo-scan)). This
> is the one screen that goes online; everything else runs fully offline.

## Stack

- **Vite + React + TypeScript**
- **framer-motion** for animations (stat bars, card/detail transitions, the
  discovery celebration) — all gated behind `prefers-reduced-motion`
- **vite-plugin-pwa** (Workbox) for offline + home-screen install
- **localStorage** for the collection (behind a swappable `PlantdexStore`)
- **Cloudflare Pages Functions** for the Scan tab — `/api/scan` proxies Dragoneye
  so the API key stays server-side (the client never sees it)

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

So the Dragoneye API key never reaches the browser, the Scan feature calls the
app's own server, which lives in `functions/` as **Cloudflare Pages Functions**
(file-based routing). Two endpoints:

- **`POST /api/scan`** (`functions/api/scan.ts`) — receives the captured photo,
  calls Dragoneye with the server-side `DRAGONEYE_API_KEY`, and returns the flat
  prediction JSON. The key is read via `context.env` and never sent to the client.
- **`GET /api/health`** (`functions/api/health.ts`) — a liveness probe that also
  reports whether `DRAGONEYE_API_KEY` is set (a boolean, never the key). The Scan
  tab calls it on open to show a "setup needed" prompt instead of wasting a photo.

```bash
pnpm pages:dev    # Vite + Functions on one origin (Wrangler), with HMR
```

Plain `pnpm dev` does **not** serve Functions, so scanning is unavailable there —
use `pnpm pages:dev`. Provide the key locally in `.dev.vars` (gitignored; see
`.dev.vars.example`):

```
DRAGONEYE_API_KEY=your-key
```

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
3. Set the server secret so scanning works:
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

## Photo scan

The **Scan** tab takes a photo, runs it through a dedicated Dragoneye custom
model, and saves the matched species to your collection.

### Set your API key (server-side)

Scanning is the only feature that calls a server, and unlike the other examples in
this repo it keeps the key **server-side**. Create a Playground key at
[playground.dragoneye.ai/account](https://playground.dragoneye.ai/account), then:

```bash
cp .dev.vars.example .dev.vars   # then paste your key: DRAGONEYE_API_KEY=dgn_...
pnpm pages:dev                   # serves /api/* alongside the app
```

In production, set `DRAGONEYE_API_KEY` as a Cloudflare Pages environment variable
instead (see [Deploy](#deploy)). Without a key the Scan tab shows a "setup needed"
prompt; the key is never `VITE_`-prefixed and never enters the browser bundle.

### How the proxy works

The browser POSTs the photo to `/api/scan`; the Function does the Dragoneye round
trip with the **`dragoneye-node` SDK** (server-side, key from `context.env`) and
returns JSON. This works inside the Cloudflare Workers runtime because the SDK is
ESM (v3+) and decodes its Zstd-Parquet results with the pure-JS `hyparquet` +
`fzstd` packages — **no `eval`/`new Function`, no WASM** — which is exactly what
workerd allows (it blocks runtime code generation and WASM compilation). The only
config it needs is `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`,
so the bundler can resolve the SDK's optional `node:fs`/`node:path` imports (used
only by a file-path helper we never call). No `index.html` import map is needed.

### The model

The `plantdex` model is a Dragoneye **`recognize_anything`** custom model whose 50
categories are exactly the plants in `data/plants.json` (each plant's `commonName`,
with its latin name + description as the category definition). Because we control the
category names, a prediction's `category.name` maps straight back to a dex entry. The
model reference is **`recognize_anything/plantdex`** (see `functions/api/scan.ts`).

### The flow

```ts
// src/scan/dragoneyeClient.ts — client: just a fetch to our own Function
const form = new FormData();
form.append("image", file);                                       // File from <input capture>
const res = await fetch("/api/scan", { method: "POST", body: form });
const result = await res.json();                                  // flat ImagePredictionResult
const { match } = mapPredictionToPlant(result, PLANTS);           // src/scan/mapPredictionToPlant.ts
if (match) await store.discover(match.plant.id, "scan", { confidence: match.confidence });
```

`functions/api/scan.ts` does the Dragoneye work with the `dragoneye-node` SDK (key
server-side) and returns the flat JSON. `mapPredictionToPlant` (pure + unit-tested)
flattens the result's
`object_predictions[].predictions[].category`, ranks by score, and matches
`category.name` against each plant's `commonName` / `taxonRef` (exact, then substring).

The captured photo itself is **not persisted** (only the discovery + confidence are).
`DiscoveryRecord` already carries `photoRef` / `rawPrediction` / `confidence`, so adding
photo storage later is just swapping `LocalStorageStore` for an IndexedDB implementation
(`savePhoto` / `getPhoto`) — no UI changes.

## Image credits

Plant photos come from **Wikimedia Commons** and are shown with per-image
attribution (author + license) in each plant's detail view, as the licenses
require.

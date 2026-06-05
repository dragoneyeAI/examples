// Cloudflare Pages Function — file-based routing maps this to `POST /api/scan`.
//
// This is the ONLY networked path in Plantdex. The browser POSTs a captured
// photo here as multipart/form-data; this Function holds the Dragoneye API key
// as an encrypted secret and proxies the classification call, so the key is
// never shipped to the client. It returns Dragoneye's flat `object_predictions`
// JSON verbatim (see src/scan/predictionTypes.ts), which the client maps to a
// Plantdex species via src/scan/mapPredictionToPlant.ts.
//
// Why the SDK runs here (Workers runtime): `dragoneye-node` v3+ is ESM and
// decodes its Zstd-Parquet results with the pure-JS `hyparquet` + `fzstd`
// packages — no `eval`/`new Function`, no WASM — which is what workerd allows.
// It only needs `compatibility_flags = ["nodejs_compat"]` (see wrangler.toml)
// so the bundler can resolve the SDK's optional `node:fs`/`node:path` imports
// (used by a file-path helper we never call). We pass `apiKey` explicitly so the
// SDK never reaches for `process.env`.

import { Dragoneye } from "dragoneye-node";

// Set as an encrypted env var in the Cloudflare Pages dashboard (production) or
// in `.dev.vars` for local `pnpm pages:dev`. Never `VITE_`-prefixed.
export interface Env {
  DRAGONEYE_API_KEY?: string;
}

/** The custom recognize_anything model that recognizes Plantdex species. */
const MODEL_NAME = "recognize_anything/plantdex";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.DRAGONEYE_API_KEY;
  if (!apiKey) {
    // 503 → the client shows a "setup needed" prompt instead of an error.
    return json({ error: "not_configured" }, 503);
  }

  let image: File | null = null;
  try {
    const form = await request.formData();
    const field = form.get("image");
    if (field instanceof File) image = field;
  } catch {
    return json({ error: "bad_request", message: "Expected multipart form data." }, 400);
  }
  if (!image) {
    return json({ error: "bad_request", message: "Missing 'image' file." }, 400);
  }

  try {
    const client = new Dragoneye({ apiKey });
    const media = Dragoneye.Image.fromBlob(
      image,
      image.name || "scan.jpg",
      image.type || "image/jpeg",
    );
    const result = await client.classification.predictImage(media, MODEL_NAME);
    return json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Prediction failed.";
    return json({ error: "prediction_failed", message }, 502);
  }
};

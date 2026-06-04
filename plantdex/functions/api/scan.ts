// Cloudflare Pages Function — file-based routing maps this to `POST /api/scan`.
//
// This is the ONLY network call Plantdex makes. The browser POSTs the captured
// photo here as multipart/form-data; this Function holds the Dragoneye API key
// server-side (so it never ships to the client) and proxies the classification
// to the custom `recognize_anything/plantdex` model via the `dragoneye-node`
// SDK. It returns the model's FLAT result shape (`object_predictions[]`) to the
// client as JSON — see `src/scan/predictionTypes.ts`.
//
// Why the SDK runs here (Workers runtime) rather than in the browser: doing the
// call client-side would expose the key to every user. The SDK (v3+, ESM)
// decodes its Zstd-Parquet results with pure-JS `fzstd` + `hyparquet` — no
// `eval` / `new Function`, no WASM — which is what workerd permits. This needs
// `compatibility_flags = ["nodejs_compat"]` in wrangler.toml so the bundler can
// resolve the SDK's optional `node:fs`/`node:path` imports (used only by a
// file-path helper we never call). The apiKey is passed explicitly so the SDK
// never reads `process.env`.

import { Dragoneye } from "dragoneye-node";

export interface Env {
  /** Encrypted Pages env var (prod) / `.dev.vars` (local). Never `VITE_`-prefixed. */
  DRAGONEYE_API_KEY?: string;
}

const MODEL_NAME = "recognize_anything/plantdex";

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.DRAGONEYE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Scanning isn’t set up: DRAGONEYE_API_KEY is missing on the server." },
      { status: 503 },
    );
  }

  let photo: File | null = null;
  try {
    const form = await request.formData();
    const field = form.get("photo");
    if (field instanceof File) photo = field;
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data with a 'photo' file." },
      { status: 400 },
    );
  }
  if (!photo) {
    return Response.json({ error: "Missing 'photo' file in the request." }, { status: 400 });
  }

  try {
    const client = new Dragoneye({ apiKey });
    // `photo` is a File (a Blob); fromBlob reads its image/* MIME type.
    const image = await Dragoneye.Image.fromBlob(photo, photo.name || "scan");
    const result = await client.classification.predictImage(image, MODEL_NAME);
    // Pass the flat custom-model shape straight through to the client.
    return Response.json({ object_predictions: result.object_predictions });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "The plant scan could not be completed.";
    return Response.json({ error: message }, { status: 502 });
  }
};

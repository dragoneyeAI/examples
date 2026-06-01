// Cloudflare Pages Function — `POST /api/scan`.
//
// This is the server-side proxy for the photo scan. The browser POSTs the
// captured image here; this Function calls Dragoneye with the secret
// `DRAGONEYE_API_KEY` (an encrypted Pages env var) and returns the flat
// prediction JSON. The key therefore never reaches the client.
//
// We use the official `dragoneye-node` SDK here. As of v3 the SDK is published
// as an ES module and — crucially — decodes its Zstd-compressed Parquet results
// with the pure-JS `hyparquet` + `fzstd` packages (no `new Function`/`eval`, no
// WebAssembly). That's exactly what the Cloudflare Workers runtime (workerd)
// requires: it blocks runtime code generation and runtime WASM compilation, so
// earlier SDK versions (and `hyparquet-compressors`, whose `compressors` export
// eagerly instantiates a WASM Snappy module) crash a Worker. v3 runs cleanly.
//
// Two notes on running it inside a Worker:
//   • We pass `apiKey` explicitly, so the SDK never falls back to reading
//     `process.env` — no Node globals are touched at runtime.
//   • `nodejs_compat` is enabled in wrangler.toml because the SDK's media module
//     has dynamic `node:fs`/`node:path` imports (only in its file-path helper,
//     which we don't call) that the bundler still needs to resolve.

import { Dragoneye } from "dragoneye-node";

export interface Env {
  // Set as an encrypted env var in the Pages dashboard (and in .dev.vars for
  // `wrangler pages dev`). Optional in the type so /api/health can report when
  // it's missing rather than crash.
  DRAGONEYE_API_KEY?: string;
}

// The custom model built for Plantdex (Dragoneye MCP). Model references take the
// form `recognize_anything/<model_name>`.
const MODEL_REFERENCE = "recognize_anything/plantdex";
// Cap the prediction poll so a stuck task can't hang the request indefinitely.
const PREDICT_TIMEOUT_SECONDS = 60;

// ---- Response shape returned to the client (a flattened subset of the SDK's
// ClassificationPredictImageResponse; matches src/scan/predictionTypes.ts). The
// Plantdex model has no attributes, so we drop them and the task metadata and
// return just the bbox + category guesses. ----
interface CategoryPrediction {
  category: { id: number; name: string; score: number };
}
interface ObjectPrediction {
  normalizedBbox: [number, number, number, number];
  predictions: CategoryPrediction[];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.DRAGONEYE_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY") {
    return Response.json(
      { error: "Scan is not configured on the server (DRAGONEYE_API_KEY is unset)." },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await context.request.formData();
    const field = form.get("image");
    if (field instanceof File) file = field;
  } catch {
    // fall through to the 400 below
  }
  if (!file) {
    return Response.json(
      { error: "Expected a multipart form with an 'image' file field." },
      { status: 400 },
    );
  }

  try {
    const client = new Dragoneye({ apiKey });
    const image = Dragoneye.Image.fromBlob(file, file.name, file.type || "image/jpeg");
    const result = await client.classification.predictImage(
      image,
      MODEL_REFERENCE,
      PREDICT_TIMEOUT_SECONDS,
    );

    const object_predictions: ObjectPrediction[] = result.object_predictions.map((obj) => ({
      normalizedBbox: obj.normalizedBbox,
      predictions: obj.predictions.map((pred) => ({
        category: {
          id: pred.category.id,
          name: pred.category.name,
          score: pred.category.score,
        },
      })),
    }));

    return Response.json({ object_predictions });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Scan failed" },
      { status: 502 },
    );
  }
};

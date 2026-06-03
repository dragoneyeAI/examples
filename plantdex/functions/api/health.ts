// Cloudflare Pages Function — file-based routing maps this to `GET /api/health`.
//
// This is the skeleton entry point for the server side that the future Scan
// feature (branch 06-01-plantdex_scan_features) will build on: the client will
// POST a photo to `/api/scan`, this Function will hold the Dragoneye API key as
// an encrypted secret and proxy the classification call, so the key is never
// shipped to the browser.
//
// For now it's a pure liveness check. It deliberately does NOT read the
// Dragoneye secret, so the healthcheck reports "ok" even before the key is
// configured — it verifies the Functions runtime is reachable, nothing more.

// Shared env shape. The scan-features branch adds `DRAGONEYE_API_KEY: string`
// here (set as an encrypted env var in the Cloudflare Pages dashboard).
export interface Env {}

export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json({
    status: "ok",
    service: "plantdex-pages-functions",
    time: new Date().toISOString(),
  });
};

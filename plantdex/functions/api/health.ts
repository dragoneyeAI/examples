// Cloudflare Pages Function — file-based routing maps this to `GET /api/health`.
//
// A liveness check the Scan tab calls on open: it confirms the Functions
// runtime is reachable AND reports whether the Dragoneye key is configured, so
// the UI can show a "setup needed" prompt before anyone wastes a photo on a
// scan that would 503. It only ever returns a boolean — the key itself is never
// read into the response.

export interface Env {
  // Set as an encrypted env var in the Cloudflare Pages dashboard (production)
  // or in `.dev.vars` for local `pnpm pages:dev`. Never `VITE_`-prefixed.
  DRAGONEYE_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({
    status: "ok",
    service: "plantdex-pages-functions",
    time: new Date().toISOString(),
    // Boolean only — does not leak the key.
    dragoneyeConfigured: Boolean(env.DRAGONEYE_API_KEY),
  });
};

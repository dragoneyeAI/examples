// Cloudflare Pages Function — file-based routing maps this to `GET /api/health`.
//
// Liveness check for the Pages Functions runtime that powers the Scan tab. The
// Scan screen calls this on open: `status: "ok"` confirms the client→Function
// path works, and `dragoneyeConfigured` tells the UI whether the server-side
// `DRAGONEYE_API_KEY` is set so it can show a "setup needed" prompt before the
// user tries to scan.
//
// It reports only the PRESENCE of the key (a boolean) — never the value — so
// the secret is never exposed to the client.

export interface Env {
  /** Encrypted Pages env var (prod) / `.dev.vars` (local). Never `VITE_`-prefixed. */
  DRAGONEYE_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  return Response.json({
    status: "ok",
    service: "plantdex-pages-functions",
    dragoneyeConfigured: Boolean(env.DRAGONEYE_API_KEY),
    time: new Date().toISOString(),
  });
};

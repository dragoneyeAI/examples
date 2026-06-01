// Cloudflare Pages Function — file-based routing maps this to `GET /api/health`.
//
// A liveness probe for the server side that powers the Scan feature. The browser
// calls this when the Scan tab opens to learn (a) that the Functions runtime is
// reachable, and (b) whether scanning is actually configured — i.e. whether the
// `DRAGONEYE_API_KEY` secret is set. It returns only a boolean for that, never
// the key itself, so the client can show a "setup needed" prompt instead of
// letting the user waste a photo on a request that would 503.

export interface Env {
  // Set as an encrypted env var in the Pages dashboard (and in .dev.vars for
  // `wrangler pages dev`). Read server-side only — see functions/api/scan.ts.
  DRAGONEYE_API_KEY?: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const key = context.env.DRAGONEYE_API_KEY;
  const configured = Boolean(key) && key !== "YOUR_API_KEY";
  return Response.json({
    status: "ok",
    service: "plantdex-pages-functions",
    time: new Date().toISOString(),
    scan: { configured },
  });
};

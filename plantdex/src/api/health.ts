// Client helper for the Pages Function healthcheck (`GET /api/health`).
//
// Uses an absolute path: Pages Functions are only served at the domain root on
// Cloudflare Pages, so `/api/health` is correct there. On any other host — or
// under plain `vite dev`, which doesn't serve Functions — the fetch just fails
// and callers treat that as "down". Use `pnpm pages:dev` to exercise it locally.

export interface HealthResponse {
  status: string;
  service: string;
  time: string;
  /** Whether the server has a Dragoneye key set, so the Scan tab can prompt for
   *  setup instead of letting the user waste a photo. */
  scan: { configured: boolean };
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch("/api/health", { signal });
  if (!res.ok) throw new Error(`health ${res.status}`);
  return (await res.json()) as HealthResponse;
}

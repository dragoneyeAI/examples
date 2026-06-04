// Client helper for the Pages Function healthcheck (`GET /api/health`).
//
// Uses an absolute path: Pages Functions are only served at the domain root on
// Cloudflare Pages, so `/api/health` is correct there. On any other host — or
// under plain `vite dev`, which doesn't serve Functions — the fetch just fails
// and callers treat that as "down". Use `pnpm pages:dev` to exercise it locally.

export interface HealthResponse {
  status: string;
  service: string;
  /** Whether the server-side DRAGONEYE_API_KEY is configured (no value leaked). */
  dragoneyeConfigured: boolean;
  time: string;
}

export async function checkHealth(signal?: AbortSignal): Promise<HealthResponse> {
  const res = await fetch("/api/health", { signal });
  if (!res.ok) throw new Error(`health ${res.status}`);
  return (await res.json()) as HealthResponse;
}

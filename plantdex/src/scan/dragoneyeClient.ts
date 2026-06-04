// Client helper for the Scan proxy (`POST /api/scan`).
//
// Uploads the captured photo as multipart/form-data to the Pages Function, which
// holds the Dragoneye key server-side and runs the prediction. Returns the flat
// custom-model result; feed it through `mapPredictionToPlant` to get a dex entry.
//
// Like the healthcheck, this uses an absolute path: Pages Functions are only
// served at the domain root. Under plain `vite dev` (which doesn't serve
// Functions) the fetch fails — use `pnpm pages:dev` to scan locally.

import type { ScanResult } from "./predictionTypes";

interface ScanErrorBody {
  error?: string;
}

export async function scanPhoto(
  photo: Blob,
  signal?: AbortSignal,
): Promise<ScanResult> {
  const form = new FormData();
  form.append("photo", photo, "scan.jpg");

  const res = await fetch("/api/scan", { method: "POST", body: form, signal });

  if (!res.ok) {
    // Prefer the Function's structured error message when present.
    let detail = `Scan failed (${res.status})`;
    try {
      const body = (await res.json()) as ScanErrorBody;
      if (body?.error) detail = body.error;
    } catch {
      // non-JSON error body — keep the status-based message
    }
    throw new Error(detail);
  }

  return (await res.json()) as ScanResult;
}

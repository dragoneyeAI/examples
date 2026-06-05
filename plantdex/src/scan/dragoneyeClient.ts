// Client helper for the Scan feature: POSTs a captured photo to the
// `/api/scan` Pages Function and returns the flat Dragoneye result.
//
// The browser NEVER talks to Dragoneye directly — that would ship the API key
// to every user. Instead the photo goes to our Pages Function (functions/api/
// scan.ts), which holds `DRAGONEYE_API_KEY` server-side and proxies the call.
// We deliberately keep the key out of any `VITE_`-prefixed env, so it can't end
// up in the client bundle.

import type { ScanResult } from "./predictionTypes";

/** Reason a scan failed, so the UI can show the right message. */
export type ScanErrorKind = "not_configured" | "no_subject" | "network" | "server";

export class ScanError extends Error {
  kind: ScanErrorKind;
  constructor(kind: ScanErrorKind, message: string) {
    super(message);
    this.name = "ScanError";
    this.kind = kind;
  }
}

/**
 * Send an image to `/api/scan` and get back the raw prediction.
 * Throws a {@link ScanError} with a `kind` the UI can branch on.
 */
export async function scanPhoto(
  blob: Blob,
  signal?: AbortSignal,
): Promise<ScanResult> {
  const form = new FormData();
  form.append("image", blob, "scan.jpg");

  let res: Response;
  try {
    res = await fetch("/api/scan", { method: "POST", body: form, signal });
  } catch (err) {
    if (signal?.aborted) throw err; // let callers see aborts as-is
    throw new ScanError("network", "Couldn't reach the scan service.");
  }

  if (res.status === 503) {
    throw new ScanError(
      "not_configured",
      "The scan service isn't configured with an API key yet.",
    );
  }
  if (!res.ok) {
    throw new ScanError("server", `Scan failed (HTTP ${res.status}).`);
  }

  return (await res.json()) as ScanResult;
}

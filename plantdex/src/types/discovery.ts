// Persistence model for the user's collection. Kept deliberately small and
// future-proof: the optional fields below are written by the FUTURE photo-scan
// feature (a Dragoneye prediction → discovered entry) with no schema churn.

export type DiscoverySource = "manual" | "scan";

export interface DiscoveryRecord {
  plantId: string;
  /** ISO timestamp of first discovery. */
  dateSeen: string;
  source: DiscoverySource;

  // ---- FUTURE (photo scan) — unused by the current UI ----
  /** IndexedDB blob key for the captured photo (not a URL). */
  photoRef?: string;
  /** Raw Dragoneye prediction JSON, kept for provenance. */
  rawPrediction?: unknown;
  /** Top taxon score from the prediction. */
  confidence?: number;
}

/** Lightweight app-level state (not per-plant) for the Home dashboard. */
export interface AppMeta {
  /** ISO date (YYYY-MM-DD) the app was last opened. */
  lastOpenedDate?: string;
  /** Consecutive-day open streak. */
  streakCount: number;
  /** Last plant the user viewed, for quick-resume. */
  lastViewedPlantId?: string;
}

export const EMPTY_META: AppMeta = { streakCount: 0 };
